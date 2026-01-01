interface TestimonialData {
  rating?: string;
  consent?: string;
}

interface ContactMessage {
  id: string;
  category: string;
  email: string;
  name: string;
  message: string;
  data?: TestimonialData;
  received_at: string; // Timestamp
}

export type { ContactMessage, TestimonialData };
