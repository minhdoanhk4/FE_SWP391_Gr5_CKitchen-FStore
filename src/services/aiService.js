const suggestCache = new Map();

export function clearSuggestCache() {
  suggestCache.clear();
}

export async function suggestIngredients(productName, allIngredients = []) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chưa cấu hình VITE_GROQ_API_KEY. Thêm vào file .env để dùng tính năng AI.",
    );
  }

  if (suggestCache.has(productName)) {
    return suggestCache.get(productName);
  }

  const catalog = allIngredients
    .map((i) => `${i.id}:${i.ingredientName || i.name}(${i.unit})`)
    .join("\n");

  const systemPrompt = `Bạn là đầu bếp chuyên nghiệp với 20 năm kinh nghiệm ẩm thực Việt Nam và quốc tế.
Nhiệm vụ: khi được hỏi về nguyên liệu cho một món ăn, hãy dựa vào kiến thức ẩm thực thực tế để xác định nguyên liệu nào thực sự cần — rồi tìm chúng trong danh sách kho được cung cấp.
Không bao giờ chọn nguyên liệu không liên quan tới món chỉ để cho đủ số lượng.`;

  const userPrompt = `Món: "${productName}" (50 phần công nghiệp)

Bước 1 — Dựa trên kiến thức nấu ăn, liệt kê (trong đầu) các nguyên liệu thiết yếu thực sự cần để làm món này.
Bước 2 — So với danh sách kho bên dưới, chỉ lấy những nguyên liệu khớp CẢ HAI (vừa cần cho món, vừa có trong kho).
Bước 3 — Nếu không tìm được nguyên liệu nào khớp thực sự, trả về [].

Danh sách kho:
${catalog || "(trống)"}

Quy tắc:
- Chỉ chọn nguyên liệu có trong danh sách kho (dùng đúng ingredientId)
- Mỗi reason phải nêu rõ vai trò cụ thể của nguyên liệu trong món này (không viết chung chung)
- Ước lượng quantity hợp lý cho 50 phần ăn

Trả về chỉ JSON array, không thêm bất kỳ văn bản nào khác:
[{"ingredientId":"id","name":"tên","quantity":số,"unit":"đơn vị","reason":"vai trò cụ thể trong món"}]`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error(
        "AI đang bận (quá giới hạn). Vui lòng thử lại sau vài giây.",
      );
    }
    throw new Error(
      errorData.error?.message || `API error: ${response.status}`,
    );
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  const match = rawText.match(/\[[\s\S]*\]/);

  if (!match) {
    throw new Error("Phản hồi AI không hợp lệ, vui lòng thử lại.");
  }

  const result = JSON.parse(match[0]);
  if (result.length > 0) suggestCache.set(productName, result);
  return result;
}
