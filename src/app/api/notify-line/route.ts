import { NextRequest, NextResponse } from 'next/server';

interface LineNotifyPayload {
  queueId: string;
  citizenName: string;
  phone: string;
  district: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTimeSlot?: string;
  submitterRole: string;
  notificationType?: 'queue' | 'complaint' | 'emergency1300';
  description?: string;
  locationDetail?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: LineNotifyPayload = await req.json();

    const {
      queueId,
      citizenName,
      phone,
      district,
      serviceType,
      appointmentDate,
      appointmentTimeSlot,
      submitterRole,
      notificationType = 'queue',
      description,
      locationDetail,
    } = body;

    if (!queueId || !citizenName) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องมี queueId และ citizenName)' },
        { status: 400 }
      );
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const targetUserId = process.env.LINE_USER_ID;

    const isEmergencyOrComplaint =
      notificationType === 'complaint' || notificationType === 'emergency1300';

    const headerColor =
      notificationType === 'emergency1300'
        ? '#dc2626'
        : notificationType === 'complaint'
        ? '#d97706'
        : '#d81b60';

    const headerSubtitle =
      notificationType === 'emergency1300'
        ? '🚨 แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300 (เร่งด่วน)'
        : notificationType === 'complaint'
        ? '📢 แจ้งเรื่องร้องเรียน/ข้อเสนอแนะ (GECC)'
        : 'ส่งตรวจเอกสารล่วงหน้าเรียบร้อยแล้ว';

    const headerTitle = isEmergencyOrComplaint
      ? `รหัสติดตามเรื่อง: ${queueId}`
      : `บัตรคิว Fast Track: ${queueId}`;

    // Create rich message structure for LINE Messaging API
    const flexMessage = {
      type: 'flex',
      altText: isEmergencyOrComplaint
        ? `🚨 พมจ.แพร่ 1300/ร้องเรียน: ${queueId} (${serviceType}) อ.${district}`
        : `📢 พมจ.แพร่ (GECC): คำร้องใหม่ ${queueId} (${serviceType})`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: headerColor,
          paddingAll: '16px',
          contents: [
            {
              type: 'text',
              text: 'ศูนย์บริการร่วม พมจ.แพร่ (GECC)',
              color: '#ffffff',
              size: 'xs',
              weight: 'bold',
            },
            {
              type: 'text',
              text: headerTitle,
              color: '#ffffff',
              size: 'lg',
              weight: 'bold',
              margin: 'sm',
            },
            {
              type: 'text',
              text: headerSubtitle,
              color: '#fce4ec',
              size: 'xxs',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: isEmergencyOrComplaint ? 'ผู้แจ้ง:' : 'ผู้ยื่นเรื่อง:', size: 'sm', color: '#64748b', flex: 2 },
                { type: 'text', text: citizenName, size: 'sm', weight: 'bold', color: '#1e293b', flex: 4 },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'เบอร์ติดต่อ:', size: 'sm', color: '#64748b', flex: 2 },
                { type: 'text', text: phone, size: 'sm', color: '#1e293b', flex: 4 },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'อำเภอ:', size: 'sm', color: '#64748b', flex: 2 },
                { type: 'text', text: `อ.${district} จ.แพร่`, size: 'sm', color: '#1e293b', flex: 4 },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: isEmergencyOrComplaint ? 'ประเภท:' : 'ประเภทบริการ:', size: 'sm', color: '#64748b', flex: 2 },
                { type: 'text', text: serviceType, size: 'sm', weight: 'bold', color: headerColor, flex: 4 },
              ],
            },
            ...(isEmergencyOrComplaint && locationDetail
              ? [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'พิกัด/สถานที่:', size: 'sm', color: '#64748b', flex: 2 },
                      { type: 'text', text: locationDetail, size: 'sm', color: '#1e293b', wrap: true, flex: 4 },
                    ],
                  },
                ]
              : []),
            ...(isEmergencyOrComplaint && description
              ? [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'รายละเอียด:', size: 'sm', color: '#64748b', flex: 2 },
                      { type: 'text', text: description, size: 'sm', color: '#1e293b', wrap: true, flex: 4 },
                    ],
                  },
                ]
              : [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'วันนัดหมาย:', size: 'sm', color: '#64748b', flex: 2 },
                      {
                        type: 'text',
                        text: `${appointmentDate} ${appointmentTimeSlot ? `(${appointmentTimeSlot})` : ''}`,
                        size: 'sm',
                        color: '#1a237e',
                        weight: 'bold',
                        flex: 4,
                      },
                    ],
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'ช่องทางยื่น:', size: 'sm', color: '#64748b', flex: 2 },
                      { type: 'text', text: submitterRole, size: 'sm', color: '#475569', flex: 4 },
                    ],
                  },
                ]),
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'text',
              text: isEmergencyOrComplaint
                ? '⚡ เจ้าหน้าที่ศูนย์ 1300 / GECC โปรดเข้าตรวจสอบและบันทึกผล Take Action ทันที'
                : '💡 กรุณานำบัตรคิว Fast Track นี้แสดงที่เคาน์เตอร์ 1 พมจ.แพร่ (ศาลากลาง จ.แพร่) ในวันนัดหมาย',
              size: 'xxs',
              color: isEmergencyOrComplaint ? '#dc2626' : '#0f766e',
              wrap: true,
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'ศูนย์ราชการสะดวก พมจ.แพร่ | สายด่วน 1300 | โทร 054-511-572',
              align: 'center',
              size: 'xxs',
              color: '#94a3b8',
            },
          ],
        },
      },
    };

    // Text fallback version
    const textMessage = isEmergencyOrComplaint
      ? {
          type: 'text',
          text: `🚨 [พมจ.แพร่ 1300 / ร้องเรียนด่วน]\n🔖 รหัสเรื่อง: ${queueId}\n📌 ประเภท: ${serviceType}\n👤 ผู้แจ้ง: ${citizenName}\n📞 เบอร์โทร: ${phone}\n📍 พื้นที่: อ.${district} จ.แพร่ ${locationDetail ? `(${locationDetail})` : ''}\n📝 รายละเอียด: ${description || '-'}\n\nเจ้าหน้าที่สามารถตรวจสอบและ Take Action ได้ทันทีในระบบ`,
        }
      : {
          type: 'text',
          text: `📢 [พมจ.แพร่ GECC Smart Care]\nมีคำร้องตรวจเอกสารใหม่!\n\n🔖 รหัสคิว: ${queueId}\n👤 ผู้ยื่น: ${citizenName} (${submitterRole})\n📞 เบอร์โทร: ${phone}\n📍 พื้นที่: อ.${district} จ.แพร่\n📌 บริการ: ${serviceType}\n📅 วันที่นัดหมาย: ${appointmentDate} ${appointmentTimeSlot || ''}\n\nเจ้าหน้าที่สามารถตรวจสอบเอกสารได้ที่ระบบหลังบ้าน GECC SLA`,
        };

    if (!token) {
      // Return simulated success with full payload for testing
      return NextResponse.json({
        success: true,
        simulated: true,
        message:
          'แจ้งเตือนสำเร็จ (โหมดจำลอง: ยังไม่ได้ระบุ LINE_CHANNEL_ACCESS_TOKEN ในระบบ แต่สร้าง Flex Message สำเร็จแล้ว)',
        data: {
          queueId,
          timestamp: new Date().toISOString(),
          flexPayload: flexMessage,
          textFallback: textMessage.text,
        },
      });
    }

    // If token exists, make actual LINE Messaging API call
    const endpoint = targetUserId
      ? 'https://api.line.me/v2/bot/message/push'
      : 'https://api.line.me/v2/bot/message/broadcast';

    const lineBody = targetUserId
      ? { to: targetUserId, messages: [flexMessage, textMessage] }
      : { messages: [flexMessage, textMessage] };

    const lineRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(lineBody),
    });

    if (!lineRes.ok) {
      const errText = await lineRes.text();
      return NextResponse.json(
        {
          success: false,
          error: `ส่งแจ้งเตือน LINE ไม่สำเร็จ: ${lineRes.status} ${errText}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      simulated: false,
      message: 'ส่งแจ้งเตือนเข้า LINE Messaging API เรียบร้อยแล้ว',
      data: { queueId, timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

