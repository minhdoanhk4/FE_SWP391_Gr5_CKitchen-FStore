const suggestCache = new Map();

export async function suggestIngredients(productName, allIngredients = []) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình VITE_GROQ_API_KEY. Thêm vào file .env để dùng tính năng AI.");
  }

  if (suggestCache.has(productName)) {
    return suggestCache.get(productName);
  }

  const catalog = allIngredients
    .map((i) => `${i.id}:${i.ingredientName || i.name}(${i.unit})`)
    .join(", ");

  const prompt = `Kho nguyên liệu: ${catalog || "trống"}. Gợi ý 3-8 nguyên liệu để làm "${productName}" cho ~50 phần ăn công nghiệp. Chỉ dùng nguyên liệu trong kho. Trả về JSON array: [{"ingredientId":"id","name":"tên","quantity":số,"unit":"đơn vị"}]. Chỉ JSON, không giải thích.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error("AI đang bận (quá giới hạn). Vui lòng thử lại sau vài giây.");
    }
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  const match = rawText.match(/\[[\s\S]*\]/);

  if (!match) {
    throw new Error("Phản hồi AI không hợp lệ, vui lòng thử lại.");
  }

  const result = JSON.parse(match[0]);
  suggestCache.set(productName, result);
  return result;
}
