const XSS_PATTERN = /<script[\s\S]*?>[\s\S]*?<\/script>|<[^>]*on\w+\s*=|javascript\s*:|data\s*:\s*text\/html/i;

function stripControlChars(input: string): string {
  let result = "";
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code === 0x09 || code === 0x0A || code === 0x0D) { result += char; continue; }
    if (code < 0x20 || code === 0xFFFE || code === 0xFFFF) continue;
    result += char;
  }
  return result;
}
const MAX_INPUT_LENGTH = 50_000;

export function sanitizeUserInput(input: string): string {
  if (!input) return "";
  let cleaned = input.slice(0, MAX_INPUT_LENGTH);
  cleaned = stripControlChars(cleaned);
  cleaned = cleaned.replace(XSS_PATTERN, "");
  return cleaned.trim();
}

export function sanitizeModelOutput(output: string): string {
  if (!output) return "";
  // Strip HTML tags to prevent XSS
  const cleaned = output.replace(/<[^>]*>/g, "");
  return cleaned.trim();
}
