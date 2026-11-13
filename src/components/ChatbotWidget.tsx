'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  MessageCircle,
  PhoneCall,
  Clock,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react';

interface SpeechRecognitionResultItemLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionResultItemLike;
}

interface SpeechRecognitionEventLike {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent);
}

function chunkSpeechText(rawText: string): string[] {
  const lines = rawText
    .replace(/\*\*/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/[•👉👇]/g, ' ')
    .split(/\n+/)
    .map((line) => line.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const line of lines) {
    if (line.length <= 130) {
      chunks.push(line);
    } else {
      const parts = line.split(/(?<=[.!?])\s+|\s+(?=\d+[.)])/);
      for (const p of parts) {
        const clean = p.trim();
        if (clean) chunks.push(clean);
      }
    }
  }
  return chunks;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionTab?: {
    label: string;
    tab: 'precheck' | 'tracker' | 'gis' | 'complaint';
  };
}

interface ChatbotWidgetProps {
  onNavigateTab?: (tab: 'precheck' | 'tracker' | 'gis' | 'complaint') => void;
  onLogQuery?: (query: string) => void;
}

const QUICK_REPLIES = [
  'เอกสารทำบัตรคนพิการต้องใช้อะไรบ้าง?',
  'หลักเกณฑ์ขอเงินสงเคราะห์ครอบครัวผู้มีรายได้น้อย',
  'เวลาทำการและเปิดช่วงพักเที่ยงไหม?',
  'ค่าธรรมเนียมการรับบริการ',
  'เอกสารเงินสงเคราะห์การจัดการศพผู้สูงอายุ',
  'เอกสารกู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ',
  'เอกสารกู้ยืมเงินทุนประกอบอาชีพคนพิการ',
  'เอกสารกองทุนเด็กแรกเกิด',
];

function getBotResponse(userText: string): {
  text: string;
  actionTab?: { label: string; tab: 'precheck' | 'tracker' | 'gis' | 'complaint' };
} {
  const q = userText.toLowerCase().trim();

  // 1. กู้ยืมเงินทุนประกอบอาชีพคนพิการ (ตรวจก่อนบัตรคนพิการ)
  if (
    ((q.includes('กู้') || q.includes('ทุน') || q.includes('อาชีพ')) && q.includes('คนพิการ')) ||
    q.includes('กองทุนคนพิการ')
  ) {
    return {
      text:
        '💼 **เอกสารที่ต้องใช้สำหรับ “กู้ยืมเงินทุนประกอบอาชีพคนพิการ”:**\n' +
        '*(กองทุนส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ ปลอดดอกเบี้ย ผ่อนชำระ 5 ปี)*\n' +
        '1. สำเนาบัตรประจำตัวคนพิการ\n' +
        '2. สำเนาบัตรประชาชนและทะเบียนบ้านคนพิการ / ผู้ดูแล\n' +
        '3. แผนงานโครงการประกอบอาชีพและประมาณการค่าใช้จ่าย\n' +
        '4. เอกสารผู้ค้ำประกัน (บัตรประชาชน, ทะเบียนบ้าน, หนังสือยินยอมคู่สมรส)\n' +
        '5. แผนที่แสดงสถานที่ประกอบอาชีพ\n\n' +
        '✅ **ค่าธรรมเนียม:** ฟรี 0 บาท (ปลอดดอกเบี้ย 100%) สามารถส่งตรวจเอกสารล่วงหน้าและจองคิว Fast Track ได้เลยครับ',
      actionTab: { label: 'ไปหน้าส่งตรวจเอกสาร (กู้ยืมทุนคนพิการ)', tab: 'precheck' },
    };
  }

  // 2. กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ
  if (
    ((q.includes('กู้') || q.includes('ทุน') || q.includes('อาชีพ')) &&
      (q.includes('ผู้สูงอายุ') || q.includes('สูงอายุ'))) ||
    q.includes('กองทุนผู้สูงอายุ')
  ) {
    return {
      text:
        '👵 **เอกสารที่ต้องใช้สำหรับ “กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ”:**\n' +
        '*(กองทุนผู้สูงอายุ ปลอดดอกเบี้ย รายบุคคลสูงสุด 30,000 บาท หรือรายกลุ่ม)*\n' +
        '1. สำเนาบัตรประชาชนและทะเบียนบ้านของผู้กู้ (อายุ 60 ปีขึ้นไป)\n' +
        '2. แผนการประกอบอาชีพและประมาณการค่าใช้จ่าย\n' +
        '3. สำเนาบัตรประชาชนและทะเบียนบ้านของผู้ค้ำประกัน\n' +
        '4. ใบรับรองแพทย์แสดงว่ามีสุขภาพแข็งแรงสามารถประกอบอาชีพได้\n' +
        '5. รูปถ่ายและแผนที่สถานที่ประกอบอาชีพใน จ.แพร่\n\n' +
        '✅ **ค่าธรรมเนียม:** ฟรี 0 บาท (ปลอดดอกเบี้ย) สามารถส่งตรวจเอกสารล่วงหน้าเพื่อรับคิว Fast Track ได้ทันทีครับ',
      actionTab: { label: 'ไปหน้าส่งตรวจเอกสาร (กู้ยืมทุนผู้สูงอายุ)', tab: 'precheck' },
    };
  }

  // 3. เงินสงเคราะห์การจัดการศพผู้สูงอายุ (ตรวจก่อนเงินสงเคราะห์ทั่วไป)
  if (
    q.includes('จัดการศพ') ||
    q.includes('ศพ') ||
    q.includes('เสียชีวิต') ||
    q.includes('มรณบัตร')
  ) {
    return {
      text:
        '🕊️ **เอกสารที่ต้องใช้สำหรับ “เงินสงเคราะห์การจัดการศพผู้สูงอายุ”:**\n' +
        '*(เงินสงเคราะห์ในการจัดการศพผู้สูงอายุตามประเพณี รายละ 3,000 บาท)*\n' +
        '1. ใบมรณบัตรของผู้สูงอายุ (อายุ 60 ปีบริบูรณ์ขึ้นไป)\n' +
        '2. บัตรสวัสดิการแห่งรัฐของผู้เสียชีวิต (หรือหนังสือรับรองความยากจน)\n' +
        '3. สำเนาบัตรประชาชนและทะเบียนบ้านของผู้จัดการศพ\n' +
        '4. หนังสือรับรองการจัดการศพจากวัด / มัสยิด / ผู้นำศาสนา / ผู้ใหญ่บ้าน\n' +
        '5. สำเนาสมุดบัญชีธนาคารของผู้จัดการศพ\n\n' +
        '⚡ **ค่าธรรมเนียม:** ฟรี 0 บาท! ยื่นตรวจเอกสารล่วงหน้าได้ภายใน 15 นาทีครับ',
      actionTab: { label: 'ไปหน้าส่งตรวจเอกสาร (จัดการศพผู้สูงอายุ)', tab: 'precheck' },
    };
  }

  // 4. กองทุนเด็กแรกเกิด
  if (
    q.includes('เด็กแรกเกิด') ||
    q.includes('กองทุนเด็ก') ||
    q.includes('เด็ก') ||
    q.includes('แรกเกิด')
  ) {
    return {
      text:
        '👶 **เอกสารที่ต้องใช้สำหรับ “กองทุนเด็กแรกเกิด”:**\n' +
        '*(เงินอุดหนุนเพื่อการเลี้ยงดูเด็กแรกเกิด 600 บาท/เดือน แรกเกิด - 6 ปี)*\n' +
        '1. สูติบัตรเด็กแรกเกิด\n' +
        '2. สำเนาบัตรประชาชนและทะเบียนบ้านของมารดา / ผู้ปกครอง\n' +
        '3. สมุดบัญชีเงินฝากธนาคาร (กรุงไทย, ออมสิน หรือ ธ.ก.ส.)\n' +
        '4. แบบรับรองสถานะของครัวเรือน (แบบ ดร.01 และ ดร.02)\n' +
        '5. สำเนาสมุดบันทึกสุขภาพแม่และเด็ก (เฉพาะหน้าที่บันทึกการคลอด)\n\n' +
        '✅ **ค่าธรรมเนียม:** ฟรี 0 บาท ส่งตรวจเอกสารล่วงหน้าและนัดหมายคิวด่วนได้เลยครับ',
      actionTab: { label: 'ไปหน้าส่งตรวจเอกสาร (กองทุนเด็กแรกเกิด)', tab: 'precheck' },
    };
  }

  // 5. บัตรคนพิการ
  if (
    q.includes('คนพิการ') ||
    q.includes('บัตรพิการ') ||
    q.includes('เอกสารทำบัตร')
  ) {
    return {
      text:
        '📋 **เอกสารทำบัตรประจำตัวคนพิการ / ต่ออายุบัตร (พมจ.แพร่):**\n' +
        '1. เอกสารรับรองความพิการจากแพทย์ (รพ.รัฐ หรือ รพ.แพร่)\n' +
        '2. สำเนาบัตรประชาชนคนพิการ (หรือสูติบัตรกรณีเด็ก)\n' +
        '3. สำเนาทะเบียนบ้านคนพิการ\n' +
        '4. รูปถ่าย 1 นิ้ว จำนวน 2 รูป (ถ่ายไม่เกิน 6 เดือน)\n' +
        '5. สำเนาบัตรประชาชนและทะเบียนบ้านของผู้ดูแล (กรณีมีผู้ดูแล)\n\n' +
        '⚡ **ค่าธรรมเนียม:** ฟรี 0 บาท! สามารถส่งตรวจเอกสารล่วงหน้าและจองคิว Fast Track เพื่อรับบริการภายใน 15 นาทีได้เลยครับ',
      actionTab: { label: 'ไปหน้าส่งตรวจเอกสาร & จองคิว Fast Track', tab: 'precheck' },
    };
  }

  // 6. เงินสงเคราะห์ครอบครัวผู้มีรายได้น้อย
  if (
    q.includes('สงเคราะห์') ||
    q.includes('รายได้น้อย') ||
    q.includes('ยากจน') ||
    q.includes('ครอบครัว')
  ) {
    return {
      text:
        '💰 **หลักเกณฑ์ขอเงินสงเคราะห์ครอบครัวผู้มีรายได้น้อย / ผู้ประสบปัญหาทางสังคม:**\n' +
        '• **คุณสมบัติ:** เป็นครอบครัวผู้มีรายได้น้อย ยากไร้ หัวหน้าครอบครัวเจ็บป่วย ว่างงาน หรือประสบความเดือดร้อนไม่สามารถเลี้ยงดูครอบครัวได้\n' +
        '• **การช่วยเหลือ:** เงินสงเคราะห์ไม่เกินครั้งละ 3,000 บาท (ไม่เกิน 3 ครั้ง/ปีงบประมาณ ตามการประเมินของนักสังคมสงเคราะห์)\n' +
        '• **เอกสารเบื้องต้น:**\n' +
        '  1) สำเนาบัตรประชาชน และสำเนาทะเบียนบ้าน\n' +
        '  2) หน้าสมุดบัญชีธนาคารของผู้ขอรับความช่วยเหลือ\n' +
        '  3) หนังสือรับรองจากผู้นำชุมชน/อพม. หรือภาพถ่ายสภาพบ้าน/ความเดือดร้อน\n\n' +
        '📞 สามารถยื่นคำร้องทั่วไปหรือแจ้งผ่านสายด่วน พม. 1300 ได้ตลอด 24 ชม.',
      actionTab: { label: 'แจ้งขอความช่วยเหลือ / ยื่นคำร้อง', tab: 'complaint' },
    };
  }

  // 7. เวลาทำการและช่วงพักเที่ยง
  if (
    q.includes('เวลา') ||
    q.includes('พักเที่ยง') ||
    q.includes('เปิด') ||
    q.includes('กี่โมง') ||
    q.includes('ที่ไหน') ||
    q.includes('สถานที่')
  ) {
    return {
      text:
        '🕒 **เวลาทำการศูนย์บริการร่วม พมจ.แพร่ (GECC):**\n' +
        '• วันจันทร์ - วันศุกร์ เวลา **08.30 - 16.30 น.**\n' +
        '• ✅ **เปิดให้บริการต่อเนื่องช่วงพักเที่ยง 12.00-13.00 น. ทุกวันราชการ ณ ชั้น 1 ศาลากลาง จ.แพร่** (อาคาร 2 ถ.ไชยบูรณ์ ต.ในเวียง อ.เมือง จ.แพร่)\n\n' +
        '☎️ นอกเวลาราชการสามารถแชทสอบถามน้องใส่ใจ AI หรือโทร **สายด่วน พม. 1300** ฟรี 24 ชั่วโมงครับ',
    };
  }

  // 8. ค่าธรรมเนียม
  if (
    q.includes('ค่าธรรมเนียม') ||
    q.includes('กี่บาท') ||
    q.includes('ราคา') ||
    q.includes('เสียเงิน') ||
    q.includes('ค่าใช้จ่าย') ||
    q.includes('ฟรี')
  ) {
    return {
      text:
        '✨ **ค่าธรรมเนียมการรับบริการ:**\n' +
        '✅ **ฟรี 0 บาท ทุกบริการ** ไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้น!\n\n' +
        'ไม่ว่าจะเป็นการทำ/ต่ออายุบัตรคนพิการ, ยื่นขอเงินอุดหนุนเด็กแรกเกิด, กู้ยืมเงินทุนประกอบอาชีพ (ปลอดดอกเบี้ย), เงินสงเคราะห์ หรือการออกใบรับคำขออิเล็กทรอนิกส์ (e-Slip) ล้วนฟรี 0 บาท ตามมาตรฐานศูนย์ราชการสะดวก (GECC) ครับ',
    };
  }

  // 9. แจ้งเหตุฉุกเฉิน 1300 / ร้องเรียน / น้ำท่วม
  if (q.includes('1300') || q.includes('ฉุกเฉิน') || q.includes('ร้องเรียน') || q.includes('น้ำท่วม')) {
    return {
      text:
        '🚨 **แจ้งเหตุฉุกเฉิน 1300 / ร้องเรียน / แผนที่น้ำท่วม:**\n' +
        'สามารถกดแจ้งเหตุฉุกเฉินกลุ่มเปราะบางหรือร้องเรียนการบริการได้ทันที ระบบจะออกรหัสติดตาม CMP และแจ้งเตือนทีม พมจ.แพร่ ทันที หรือโทรสายด่วน 1300 (ฟรี 24 ชม.)',
      actionTab: { label: 'ไปหน้าแจ้งเหตุฉุกเฉิน 1300 / ร้องเรียน', tab: 'complaint' },
    };
  }

  // 10. เช็กสถานะ / คิว / e-Slip
  if (q.includes('สถานะ') || q.includes('คิว') || q.includes('ติดตาม') || q.includes('slip')) {
    return {
      text:
        '🔍 **ติดตามสถานะคำร้อง / พิมพ์ e-Slip:**\n' +
        'ท่านสามารถใช้รหัสคิว (เช่น PRE-2026-001) หรือเบอร์โทรศัพท์ เพื่อตรวจสอบความคืบหน้า 4 ขั้นตอน และดาวน์โหลดใบรับคำขออิเล็กทรอนิกส์ (e-Slip) ได้ในแท็บ "เช็กสถานะคำร้อง"',
      actionTab: { label: 'ไปหน้าเช็กสถานะคำร้อง', tab: 'tracker' },
    };
  }

  // 11. กู้ยืมทั่วไป (กรณีไม่ได้ระบุผู้สูงอายุหรือคนพิการ)
  if (q.includes('กู้') || q.includes('ผู้สูงอายุ')) {
    return {
      text:
        '🤝 **บริการเงินกู้ยืมปลอดดอกเบี้ย & สวัสดิการผู้สูงอายุ พมจ.แพร่ (ค่าธรรมเนียม 0 บาท):**\n' +
        '• **กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ:** รายบุคคลสูงสุด 30,000 บาท (ปลอดดอกเบี้ย)\n' +
        '• **กู้ยืมเงินทุนประกอบอาชีพคนพิการ:** ปลอดดอกเบี้ย ผ่อนชำระ 5 ปี\n' +
        '• **เงินสงเคราะห์การจัดการศพผู้สูงอายุ:** รายละ 3,000 บาท\n\n' +
        'แตะปุ่มคำถามยอดฮิตด้านล่างเพื่อดูรายการเอกสารแต่ละบริการ หรือไปที่หน้าส่งตรวจเอกสารได้เลยครับ',
      actionTab: { label: 'ดูรายการเอกสาร & จองคิว', tab: 'precheck' },
    };
  }

  return {
    text:
      '🙏 น้องใส่ใจ AI ยินดีให้บริการครับ! ท่านสามารถกดเลือกหัวข้อคำถามยอดฮิตด้านล่าง หรือสอบถามเรื่อง:\n' +
      '• เอกสารทำบัตรคนพิการ / กองทุนเด็กแรกเกิด\n' +
      '• เอกสารเงินสงเคราะห์การจัดการศพผู้สูงอายุ\n' +
      '• เอกสารกู้ยืมเงินทุนประกอบอาชีพ (ผู้สูงอายุ / คนพิการ)\n' +
      '• หลักเกณฑ์เงินสงเคราะห์ผู้มีรายได้น้อย\n' +
      '• เวลาทำการ (เปิดต่อเนื่องช่วงพักเที่ยง 12.00-13.00 น.)\n' +
      '• ค่าธรรมเนียม (ฟรี 0 บาท ทุกบริการ)\n\n' +
      '📞 ติดต่อเจ้าหน้าที่โดยตรง: 054-511-572 (ในเวลาราชการ) หรือ สายด่วน 1300 (24 ชม.)',
  };
}

export default function ChatbotWidget({ onNavigateTab, onLogQuery }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const idCounterRef = useRef(1);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsSessionRef = useRef(0);
  const autoSpeakRef = useRef(autoSpeak);
  const speakFromVoiceRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'bot',
      text:
        'สวัสดีครับ! 🤖 ผมคือ **น้องใส่ใจ AI พมจ.แพร่**\n' +
        'พร้อมตอบคำถามด้านสวัสดิการสังคม เอกสารบริการ และเวลาทำการ **ตลอด 24 ชั่วโมง**\n\n' +
        'แตะเลือกคำถามยอดฮิตด้านล่าง พิมพ์ถาม หรือกดปุ่ม 🎤 พูดถามด้วยเสียงได้เลยครับ 👇',
      timestamp: 'พร้อมบริการ 24 ชม.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const stopSpeaking = useCallback(() => {
    ttsSessionRef.current += 1;
    if (ttsDelayRef.current) {
      clearTimeout(ttsDelayRef.current);
      ttsDelayRef.current = null;
    }
    if (ttsWatchdogRef.current) {
      clearTimeout(ttsWatchdogRef.current);
      ttsWatchdogRef.current = null;
    }
    utteranceRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setSpeakingMsgId(null);
  }, []);

  const unlockSpeechSynthesis = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        const primer = new SpeechSynthesisUtterance(' ');
        primer.volume = 0;
        primer.rate = 10;
        window.speechSynthesis.speak(primer);
      }
    } catch {
      // ignore
    }
  }, []);

  const speakText = useCallback(
    (msgId: string, rawText: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setVoiceNotice('เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง (แนะนำเปิดผ่าน Chrome หรือ Safari)');
        return;
      }

      if (isInAppBrowser()) {
        setVoiceNotice(
          'พบว่ากำลังเปิดในแอป LINE/Facebook ซึ่งมักปิดเสียงและไมโครโฟน แนะนำกดเมนู ⋮/แชร์ แล้วเลือก "เปิดใน Safari / Chrome"'
        );
      }

      if (speakingMsgId === msgId) {
        stopSpeaking();
        return;
      }

      const chunks = chunkSpeechText(rawText);
      if (chunks.length === 0) return;

      ttsSessionRef.current += 1;
      const sessionId = ttsSessionRef.current;

      if (ttsDelayRef.current) {
        clearTimeout(ttsDelayRef.current);
        ttsDelayRef.current = null;
      }
      if (ttsWatchdogRef.current) {
        clearTimeout(ttsWatchdogRef.current);
        ttsWatchdogRef.current = null;
      }

      const speakChunk = (index: number) => {
        if (ttsSessionRef.current !== sessionId) return;
        if (index >= chunks.length) {
          if (ttsWatchdogRef.current) {
            clearTimeout(ttsWatchdogRef.current);
            ttsWatchdogRef.current = null;
          }
          utteranceRef.current = null;
          setSpeakingMsgId((current) => (current === msgId ? null : current));
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = 'th-TH';
        utterance.rate = 0.98;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const thaiVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith('th') && v.localService) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('th'));
        if (thaiVoice) {
          utterance.voice = thaiVoice;
        }

        utteranceRef.current = utterance;

        utterance.onstart = () => {
          if (ttsWatchdogRef.current) {
            clearTimeout(ttsWatchdogRef.current);
            ttsWatchdogRef.current = null;
          }
        };

        utterance.onend = () => {
          if (ttsSessionRef.current !== sessionId) return;
          speakChunk(index + 1);
        };

        utterance.onerror = (ev) => {
          if (ttsSessionRef.current !== sessionId) return;
          if (ttsWatchdogRef.current) {
            clearTimeout(ttsWatchdogRef.current);
            ttsWatchdogRef.current = null;
          }
          utteranceRef.current = null;
          setSpeakingMsgId((current) => (current === msgId ? null : current));
          const errCode = (ev as { error?: string })?.error;
          if (errCode && errCode !== 'interrupted' && errCode !== 'canceled') {
            setVoiceNotice(
              `ไม่สามารถอ่านออกเสียงได้ (${errCode}) กรุณาเพิ่มเสียงสื่อ / ปิดโหมดเงียบ หรือเปิดผ่าน Chrome / Safari`
            );
          }
        };

        if (index === 0) {
          ttsWatchdogRef.current = setTimeout(() => {
            if (ttsSessionRef.current !== sessionId) return;
            if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
              utteranceRef.current = null;
              setSpeakingMsgId((current) => (current === msgId ? null : current));
              setVoiceNotice(
                'เบราว์เซอร์ไม่ส่งเสียงพูดออก (ลองเปิดระดับเสียงสื่อ / ปิดโหมดเงียบ หรือเปิดลิงก์ผ่าน Safari / Chrome)'
              );
            }
          }, 2000);
        }

        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch {
          if (ttsWatchdogRef.current) {
            clearTimeout(ttsWatchdogRef.current);
            ttsWatchdogRef.current = null;
          }
          utteranceRef.current = null;
          setSpeakingMsgId(null);
          setVoiceNotice('เบราว์เซอร์บล็อกเสียงพูด กรุณากดปุ่ม "ฟังเสียง" บนข้อความอีกครั้ง');
        }
      };

      setVoiceNotice(null);
      setSpeakingMsgId(msgId);

      // Avoid Chrome/Safari bug where cancel() right before speak() cancels the new utterance
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        ttsDelayRef.current = setTimeout(() => speakChunk(0), 80);
      } else {
        speakChunk(0);
      }
    },
    [speakingMsgId, stopSpeaking]
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      ttsSessionRef.current += 1;
      if (ttsDelayRef.current) {
        clearTimeout(ttsDelayRef.current);
      }
      if (ttsWatchdogRef.current) {
        clearTimeout(ttsWatchdogRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const nextId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  const formatTime = () =>
    `${new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })} น.`;

  const sendMessage = useCallback(
    (textToSend: string, options?: { fromVoice?: boolean }) => {
      const clean = textToSend.trim();
      if (!clean || isTyping) return;

      const shouldAutoSpeak = Boolean(autoSpeakRef.current || options?.fromVoice);

      const userMsg: ChatMessage = {
        id: nextId('user'),
        sender: 'user',
        text: clean,
        timestamp: formatTime(),
      };

      onLogQuery?.(clean);

      const reply = getBotResponse(clean);
      const botMsgId = nextId('bot');

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setVoiceNotice(null);
      setIsTyping(true);

      // On direct tap/submit, start speech synchronously to satisfy iOS/Android autoplay gesture rules
      if (shouldAutoSpeak && !options?.fromVoice) {
        speakText(botMsgId, reply.text);
      }

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: botMsgId,
          sender: 'bot',
          text: reply.text,
          timestamp: formatTime(),
          actionTab: reply.actionTab,
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);

        if (shouldAutoSpeak && options?.fromVoice) {
          speakText(botMsgId, reply.text);
        }
      }, 280);
    },
    [isTyping, speakText]
  );

  const sendMessageRef = useRef(sendMessage);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    if (isInAppBrowser()) {
      setVoiceNotice(
        'เบราว์เซอร์ในแอป LINE/Facebook มักไม่รองรับไมโครโฟน กรุณากดเมนู ⋮/แชร์ แล้วเลือก "เปิดใน Safari หรือ Chrome"'
      );
      return;
    }

    const RecognitionCtor = getSpeechRecognitionConstructor();
    if (!RecognitionCtor) {
      setVoiceNotice(
        'เบราว์เซอร์นี้ยังไม่รองรับการรับคำสั่งเสียง (แนะนำ Chrome / Safari เวอร์ชันล่าสุด)'
      );
      return;
    }

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          stopSpeaking();
        } else {
          unlockSpeechSynthesis();
        }
      }
      const recognition = new RecognitionCtor();
      recognition.lang = 'th-TH';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      finalTranscriptRef.current = '';
      latestTranscriptRef.current = '';
      speakFromVoiceRef.current = true;

      recognition.onresult = (event) => {
        const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        let interim = '';
        for (let i = startIdx; i < event.results.length; i += 1) {
          const res = event.results[i];
          const text = (res?.[0]?.transcript ?? '').trim();
          if (!text) continue;
          if (res.isFinal) {
            if (!finalTranscriptRef.current.endsWith(text)) {
              finalTranscriptRef.current = `${finalTranscriptRef.current} ${text}`.trim();
            }
          } else {
            interim = `${interim} ${text}`.trim();
          }
        }
        const combined = `${finalTranscriptRef.current} ${interim}`.trim();
        if (combined) {
          latestTranscriptRef.current = combined;
          setInput(combined);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        recognitionRef.current = null;
        speakFromVoiceRef.current = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceNotice(
            'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณากดอนุญาตไมโครโฟนใน Chrome/Safari หรือเปิดผ่านเบราว์เซอร์หลัก'
          );
        } else if (event.error === 'audio-capture') {
          setVoiceNotice('ไม่พบไมโครโฟนหรือมีแอปอื่นใช้งานไมโครโฟนอยู่');
        } else if (event.error === 'network') {
          setVoiceNotice('การแปลงเสียงต้องใช้อินเทอร์เน็ต กรุณาตรวจสอบสัญญาณแล้วลองใหม่');
        } else if (event.error === 'no-speech') {
          setVoiceNotice('ยังไม่ได้ยินเสียงพูด ลองกด 🎤 แล้วพูดใกล้ไมโครโฟนใหม่อีกครั้งครับ');
        } else if (event.error !== 'aborted') {
          setVoiceNotice(`ไม่สามารถรับเสียงได้ (${event.error}) กรุณาลองพิมพ์หรือพูดใหม่`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        const spoken = (finalTranscriptRef.current || latestTranscriptRef.current).trim();
        const shouldSpeak = speakFromVoiceRef.current;
        finalTranscriptRef.current = '';
        latestTranscriptRef.current = '';
        speakFromVoiceRef.current = false;
        if (spoken) {
          sendMessageRef.current(spoken, { fromVoice: shouldSpeak });
        }
      };

      recognitionRef.current = recognition;
      setVoiceNotice(null);
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      speakFromVoiceRef.current = false;
      setVoiceNotice('ไม่สามารถเปิดไมโครโฟนได้ในขณะนี้ (ลองเปิดผ่าน Safari หรือ Chrome โดยตรง)');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    stopSpeaking();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
    setVoiceNotice(null);
    setMessages([
      {
        id: nextId('welcome'),
        sender: 'bot',
        text:
          'สวัสดีครับ! 🤖 **น้องใส่ใจ AI พมจ.แพร่** เริ่มบทสนทนาใหม่แล้วครับ\n' +
          'เลือกคำถามยอดฮิตด้านล่าง พิมพ์ถาม หรือกด 🎤 พูดสอบถามได้ตลอด 24 ชม. ครับ',
        timestamp: formatTime(),
      },
    ]);
  };

  // Helper to render simple **bold** markdown safely in bot messages
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={j} className="font-bold text-slate-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={j}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="no-print fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1100] flex flex-col items-end gap-3">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[410px] h-[540px] max-h-[82dvh] bg-white rounded-3xl shadow-2xl border-2 border-pink-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#d81b60] text-white p-4 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-xl shadow-inner shrink-0">
                🤖
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1a237e]"></span>
              </div>
              <div>
                <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                  <span>น้องใส่ใจ AI พมจ.แพร่</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                    24 ชม.
                  </span>
                </div>
                <div className="text-[11px] text-pink-100 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-emerald-300" />
                  <span>ออนไลน์ • ศูนย์บริการร่วม GECC</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const next = !autoSpeak;
                  setAutoSpeak(next);
                  if (next) {
                    unlockSpeechSynthesis();
                  } else {
                    stopSpeaking();
                  }
                }}
                title={autoSpeak ? 'ปิดอ่านออกเสียงอัตโนมัติ' : 'เปิดอ่านออกเสียงคำตอบอัตโนมัติ'}
                aria-label="สลับโหมดอ่านเสียงอัตโนมัติ"
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  autoSpeak
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{autoSpeak ? 'เสียงเปิด' : 'เสียงปิด'}</span>
              </button>
              <button
                onClick={handleReset}
                title="เริ่มสนทนาใหม่"
                className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  stopSpeaking();
                  if (recognitionRef.current) {
                    recognitionRef.current.abort();
                    recognitionRef.current = null;
                    setIsListening(false);
                  }
                  setIsOpen(false);
                }}
                title="ย่อหน้าต่างแชท"
                className="p-2 rounded-xl hover:bg-white/15 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#d81b60] to-[#ad1457] text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.sender === 'bot' ? renderFormattedText(msg.text) : msg.text}

                  {msg.actionTab && onNavigateTab && (
                    <button
                      onClick={() => {
                        stopSpeaking();
                        onNavigateTab(msg.actionTab!.tab);
                        setIsOpen(false);
                      }}
                      className="mt-2.5 w-full px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#1a237e] font-bold text-[11px] border border-indigo-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#d81b60]" />
                      <span>{msg.actionTab.label}</span>
                    </button>
                  )}

                  {msg.sender === 'bot' && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => speakText(msg.id, msg.text)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          speakingMsgId === msg.id
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span>หยุดอ่าน</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-[#1a237e]" />
                            <span>ฟังเสียง</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.3s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies Strip */}
          <div className="bg-white border-t border-slate-200 px-3 py-2.5 shrink-0 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#d81b60]" />
              <span>คำถามยอดฮิต & รายการเอกสาร (กดถามได้ทันที):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => sendMessage(qr)}
                  className="text-left text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#ad1457] border border-pink-200 transition cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Status / Notice */}
          {(isListening || voiceNotice) && (
            <div
              className={`px-3 py-1.5 text-[11px] font-medium flex items-center justify-between gap-2 shrink-0 border-t ${
                isListening
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span>
                {isListening
                  ? '🎙️ กำลังฟังเสียงภาษาไทย... พูดคำถามได้เลยครับ (กดปุ่มไมค์ซ้ำเพื่อหยุดและส่ง)'
                  : `⚠️ ${voiceNotice}`}
              </span>
              {voiceNotice && !isListening && (
                <button
                  type="button"
                  onClick={() => setVoiceNotice(null)}
                  className="text-amber-700 hover:text-amber-950 font-bold cursor-pointer"
                >
                  ปิด
                </button>
              )}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleFormSubmit}
            className="bg-slate-50 p-3 border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isTyping}
              title={isListening ? 'หยุดฟังเสียง' : 'พูดถามด้วยเสียง (ภาษาไทย)'}
              aria-label={isListening ? 'หยุดฟังเสียง' : 'พูดถามด้วยเสียง'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 border ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-md'
                  : 'bg-white hover:bg-pink-50 text-[#1a237e] border-slate-300'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              placeholder={isListening ? 'กำลังฟังเสียงของท่าน...' : 'พิมพ์หรือกด 🎤 พูดคำถาม...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d81b60]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#d81b60] to-[#1a237e] text-white flex items-center justify-center shadow-md hover:opacity-95 disabled:opacity-50 transition cursor-pointer shrink-0"
              aria-label="ส่งข้อความ"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer hotline strip */}
          <div className="bg-[#0f144a] text-white/80 text-[10px] px-3 py-1.5 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-amber-300" />
              สายด่วน พม. 1300 (ฟรี 24 ชม.)
            </span>
            <span>โทร 054-511-572</span>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="touch-manipulation group flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#1a237e] via-[#ad1457] to-[#d81b60] hover:from-[#121858] hover:to-[#ad1457] text-white font-bold text-xs sm:text-sm shadow-2xl ring-4 ring-white/80 transition transform hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="เปิดแชทบอท น้องใส่ใจ AI พมจ.แพร่"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
        <span>🤖 น้องใส่ใจ AI พมจ.แพร่ (บริการ 24 ชม.)</span>
        <MessageCircle className="w-4 h-4 text-pink-200 group-hover:text-white transition" />
      </button>
    </div>
  );
}
