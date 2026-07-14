// WhatsApp message helper using wa.me links
// No API key needed — works on mobile and desktop

export function sendWhatsApp(phone: string, message: string) {
  // Clean phone number: remove non-digits and ensure country code
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '966' + clean.substring(1); // Saudi default
  }
  if (!clean.startsWith('+')) {
    clean = '+' + clean;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${clean}?text=${encoded}`;
  window.open(url, '_blank');
}

// Auto-send via CallMeBot API — sends without any user interaction
export async function sendWhatsAppAuto(phone: string, message: string, apiKey: string): Promise<boolean> {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '966' + clean.substring(1);
  }
  try {
    const encodedMsg = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${clean}&text=${encodedMsg}&apikey=${apiKey}`;
    const response = await fetch(url);
    const text = await response.text();
    // CallMeBot returns "You will receive the message..." on success
    return text.includes('You will receive') || text.includes('Message') || response.ok;
  } catch {
    return false;
  }
}

// Message templates
export function reminderMessage(borrowerName: string, productName: string, amount: number, dueDate: string): string {
  return `السلام عليكم ${borrowerName} 👋\n\nتذكير بقسطك المستحق على: ${productName}\nالمبلغ: ${amount.toLocaleString('ar-SA')} ر.س\nتاريخ الاستحقاق: ${dueDate}\n\nيرجى التسديد في الموعد. شكراً لتعاونكم 🙏`;
}

export function paymentReceivedMessage(borrowerName: string, productName: string, amount: number, date: string): string {
  return `السلام عليكم ${borrowerName} 👋\n\nتم استلام دفعتك بقيمة: ${amount.toLocaleString('ar-SA')} ر.س\nللعقد: ${productName}\nالتاريخ: ${date}\n\nشكراً لالتزامك بالسداد 🙏`;
}

export function overdueMessage(borrowerName: string, productName: string, amount: number, daysLate: number): string {
  return `السلام عليكم ${borrowerName} 👋\n\nتنبيه: قسطك على ${productName} بقيمة ${amount.toLocaleString('ar-SA')} ر.س متأخر بـ ${daysLate} يوم\n\nيرجى السداد في أقرب وقت. للاستفسار تواصل معنا.`;
}
