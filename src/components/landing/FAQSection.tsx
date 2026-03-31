import { ScrollReveal } from "./ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does Crivox generate comments?",
    a: "Crivox sends your pasted text or image to an AI model (via Groq) and generates comments based on the tone, platform, and language you select.",
  },
  {
    q: "Does it actually fetch URLs?",
    a: "No  URL mode passes the URL as text to the AI. It does not scrape or fetch the page content. For best results, paste the actual post text.",
  },
  {
    q: "Which platforms are supported?",
    a: "LinkedIn, Twitter/X, Instagram, Facebook, Reddit, and Blog/Website. The AI is prompted to match each platform's style.",
  },
  {
    q: "How many tone styles are there?",
    a: "8 built-in tones: Professional, Casual, Witty, Supportive, Bold, Educational, Insightful, and Authoritative.",
  },
  {
    q: "Which languages are supported?",
    a: "English, Spanish, French, German, Portuguese, Hindi, Arabic, Chinese, and Japanese. Quality depends on the underlying AI model.",
  },
  {
    q: "Is my data stored?",
    a: "Your generated comments are saved to your account history when you're logged in. Input content is stored only as part of that history record.",
  },
  {
    q: "How many variations can I get?",
    a: "Up to 3 on the free plan, up to 5 on Pro. You can also regenerate individual comments.",
  },
];

export const FAQSection = () => (
  <section id="faq" className="px-4 sm:px-6 py-16 sm:py-24 max-w-2xl mx-auto">
    <ScrollReveal className="text-center mb-10 sm:mb-12">
      <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        Frequently asked questions
      </h2>
    </ScrollReveal>

    <ScrollReveal delay={0.1}>
      <Accordion type="single" collapsible className="space-y-0">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border-b border-border last:border-0"
          >
            <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-5 text-sm hover:text-blue-600 transition-colors">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollReveal>
  </section>
);
