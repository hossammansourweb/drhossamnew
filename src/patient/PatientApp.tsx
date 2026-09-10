import React, { useState, useEffect } from 'react';
import { BookingType, ClinicSettings, Appointment, ClinicConfig } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/data/defaults';
import { getClinicSettings } from '../shared/services/bookingService';
import { BookingHero } from './components/BookingHero';
import { ClinicPicker } from './components/ClinicPicker';
import { SlotPicker } from './components/SlotPicker';
import { PatientInfoForm } from './components/PatientInfoForm';
import { BookingSummaryPayment } from './components/BookingSummaryPayment';
import { BookingSuccess } from './components/BookingSuccess';
import { ClinicInfoModal } from './components/ClinicInfoModal';
import { AlertCircle } from 'lucide-react';

type PatientStep = 'hero' | 'clinic' | 'slot' | 'info' | 'payment' | 'success';

interface Props {
  settings: ClinicSettings;
}

export const PatientApp: React.FC<Props> = ({ settings: initialSettings }) => {
  const [settings, setSettings] = useState<ClinicSettings>(initialSettings);
  const [currentStep, setCurrentStep] = useState<PatientStep>('hero');
  const [bookingType, setBookingType] = useState<BookingType>('new');
  const [selectedClinic, setSelectedClinic] = useState<ClinicConfig>(
    initialSettings.clinics?.[0] || DEFAULT_SETTINGS.clinics[0]
  );
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [clinicModalOpen, setClinicModalOpen] = useState<boolean>(false);
  const [slotErrorMessage, setSlotErrorMessage] = useState<string | null>(null);

  // Sync latest settings on mount
  useEffect(() => {
    async function loadLatestSettings() {
      try {
        const s = await getClinicSettings();
        setSettings(s);
        if (s.clinics && s.clinics.length > 0) {
          // Keep current clinic choice if valid, or default to first
          setSelectedClinic(prev => {
            const match = s.clinics.find(c => c.id === prev.id);
            return match || s.clinics[0];
          });
        }
      } catch (err) {
        console.warn('Failed to fetch clinic settings in patient app:', err);
      }
    }
    loadLatestSettings();
  }, []);

  const currentPrice = bookingType === 'new' 
    ? (settings.newBookingPrice || 300) 
    : (settings.followupPrice || 200);

  const availableClinics = settings.clinics && settings.clinics.length > 0 
    ? settings.clinics 
    : DEFAULT_SETTINGS.clinics;

  // Step 1 (Hero) -> Step 2 (Clinic First)
  const handleSelectBookingType = (type: BookingType) => {
    setBookingType(type);
    setSlotErrorMessage(null);
    setCurrentStep('clinic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 (Clinic) -> Step 3 (Slots)
  const handleClinicSelected = (clinic: ClinicConfig) => {
    setSelectedClinic(clinic);
    setSlotErrorMessage(null);
    setCurrentStep('slot');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 (Slots) -> Step 4 (Patient Info)
  const handleSlotSelected = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep('info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 4 (Info) -> Step 5 (Payment Review)
  const handlePatientInfoSubmitted = (name: string, phone: string) => {
    setPatientName(name);
    setPatientPhone(phone);
    setCurrentStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Double booking handler: returns to slot selection per prompt requirements
  const handleDoubleBookingError = (msg: string) => {
    setSlotErrorMessage(msg);
    setCurrentStep('slot');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 5 -> Step 6 (Success)
  const handleBookingSuccess = (appointment: Appointment) => {
    setConfirmedAppointment(appointment);
    setCurrentStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset flow
  const handleReset = () => {
    setSelectedDate('');
    setSelectedTime('');
    setPatientName('');
    setPatientPhone('');
    setConfirmedAppointment(null);
    setSlotErrorMessage(null);
    setCurrentStep('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-between py-4" dir="rtl">
      <main className="flex-1 flex flex-col items-center justify-center">
        
        {/* Double-booking error banner if triggered */}
        {slotErrorMessage && currentStep === 'slot' && (
          <div className="w-full max-w-xl mx-auto px-4 mb-4">
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-bold shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{slotErrorMessage}</span>
            </div>
          </div>
        )}

        {/* 1. Hero: حجز جديد أو متابعة */}
        {currentStep === 'hero' && (
          <BookingHero
            settings={settings}
            onSelectBookingType={handleSelectBookingType}
            onOpenClinicInfo={() => setClinicModalOpen(true)}
          />
        )}

        {/* 2. Clinic First: اختر العيادة (طنطا / زفتى) */}
        {currentStep === 'clinic' && (
          <ClinicPicker
            clinics={availableClinics}
            bookingType={bookingType}
            price={currentPrice}
            onSelectClinic={handleClinicSelected}
            onBack={() => setCurrentStep('hero')}
          />
        )}

        {/* 3. Slot Picker: 30 days window strictly matching clinic working days & 8-min slots */}
        {currentStep === 'slot' && (
          <SlotPicker
            clinic={selectedClinic}
            settings={settings}
            bookingType={bookingType}
            price={currentPrice}
            onBack={() => setCurrentStep('clinic')}
            onSlotSelected={handleSlotSelected}
          />
        )}

        {/* 4. Patient Info: الاسم ورقم الهاتف */}
        {currentStep === 'info' && (
          <PatientInfoForm
            clinicName={selectedClinic.name}
            bookingType={bookingType}
            appointmentDate={selectedDate}
            appointmentTime={selectedTime}
            price={currentPrice}
            initialName={patientName}
            initialPhone={patientPhone}
            onBack={() => setCurrentStep('slot')}
            onSubmitInfo={handlePatientInfoSubmitted}
          />
        )}

        {/* 5. Review & Payment: مراجعة الحجز مع الفرع والتاريخ والساعة وطريقة الدفع */}
        {currentStep === 'payment' && (
          <BookingSummaryPayment
            clinic={selectedClinic}
            bookingType={bookingType}
            appointmentDate={selectedDate}
            appointmentTime={selectedTime}
            patientName={patientName}
            patientPhone={patientPhone}
            price={currentPrice}
            settings={settings}
            onBack={() => setCurrentStep('info')}
            onDoubleBookingError={handleDoubleBookingError}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {/* 6. Success: تم الحجز بنجاح وإضافة إلى Google Calendar */}
        {currentStep === 'success' && confirmedAppointment && (
          <BookingSuccess
            appointment={confirmedAppointment}
            settings={settings}
            onBookAnother={handleReset}
          />
        )}
      </main>

      {/* Clinic Information Modal */}
      <ClinicInfoModal
        isOpen={clinicModalOpen}
        onClose={() => setClinicModalOpen(false)}
        settings={settings}
      />
    </div>
  );
};
