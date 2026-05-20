export type SkinProfile = {
  skinType: string;
  mainConcern: string;
  currentActives: string[];
  ageStage: string;
  lifestyle: string[];
};

export type MessageRole = "user" | "assistant";

export type ProductRecommendation = {
  name: string;
  brand: string;
  price: number;
  description: string;
  ingredients: string[];
  concerns: string[];
  skin_type: string[];
  currency: string;
  product_url: string;
  reason: string;
};

export type ChatResponse = {
  answer: string;
  products: ProductRecommendation[];
  safety_warnings: string[];
  morning_routine: string[];
  night_routine: string[];
  lifestyle_tip: string;
  ai_source: string;
  model_used: string;
  show_details: boolean;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  response?: ChatResponse;
};
