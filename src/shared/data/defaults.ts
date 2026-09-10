import { ClinicSettings } from '../types';

export const DEFAULT_SETTINGS: ClinicSettings = {
  doctorName: 'د. حسام منصور أبوكل',
  doctorSpecialty: 'استشاري جراحة العظام بالقوات المسلحة',
  newBookingPrice: 300,
  followupPrice: 200,
  clinics: [
    {
      id: 'tanta',
      name: 'عيادة طنطا',
      city: 'طنطا',
      address: 'طنطا — شارع البحر الرئيسي مع طه الحكيم',
      googleMapsUrl: 'https://shorturl.at/75Qok',
      phone: '01100171817',
      workingDays: [6, 3], // السبت والأربعاء
      openTime: '19:00',
      closeTime: '22:00',
      startTime: '19:00',
      endTime: '22:00',
      slotIntervalMinutes: 8,
      isWorking: true
    },
    {
      id: 'zefta',
      name: 'عيادة زفتى',
      city: 'زفتى',
      address: 'زفتى — شارع الجيش، أعلى صيدلية الجمهورية',
      googleMapsUrl: 'https://shorturl.at/TyxZt',
      phone: '01100171917',
      workingDays: [0, 4], // الأحد والخميس
      openTime: '18:00',
      closeTime: '22:00',
      startTime: '18:00',
      endTime: '22:00',
      slotIntervalMinutes: 8,
      isWorking: true
    }
  ],
  phoneNumbers: [
    '01100171817',
    '01100171917',
    '01000111819',
    '0404724242'
  ],
  whatsappNumber: '01100171817',
  emergencyNumber: '01000111819',
  instagram: 'dr.hossam.abokl',
  googleMapsLink: 'https://shorturl.at/75Qok',
  workingHours: 'طنطا: السبت والأربعاء (7:00 م - 10:00 م) | زفتى: الأحد والخميس (6:00 م - 10:00 م)',
  bookingInstructions: 'يرجى الحضور قبل الموعد بـ 10 دقائق مع إحضار الفحوصات والأشعات السابقة في حال توفرها.',
  instapayIdentifier: 'dr.hossam.abokl@instapay',
  instapayPhone: '01100171817',
  instapayInstructions: 'قم بتحويل قيمة الكشف عبر تطبيق إنستاباي (InstaPay) للحساب أو رقم الهاتف الموضح، ثم قم برفع لقطة شاشة لإيصال التحويل لإتمام الحجز ومراجعته فوراً.',
  instapayQrUrl: '',
  slotDurationMinutes: 8
};
