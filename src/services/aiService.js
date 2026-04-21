/**
 * aiService — Gemini-powered ingredient suggestion for recipe management.
 *
 * Requires VITE_GEMINI_API_KEY in your .env file.
 * Get a free key at: https://aistudio.google.com/app/apikey
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Suggest ingredients for a food product using Gemini AI.
 *
 * @param {string} productName  - The product/dish name (e.g. "Bánh mì thịt")
 * @param {Array}  inventoryItems - Kitchen inventory items with { ingredientId, ingredientName }
 * @returns {Promise<Array>} Suggestions: { name, quantity, unit, inInventory, ingredientId }
 */
export async function suggestIngredients(productName, inventoryItems = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chưa cấu hình VITE_GEMINI_API_KEY. Thêm vào file .env để dùng tính năng AI."
    );
  }

  const inventoryNames = inventoryItems
    .map((i) => i.ingredientName || i.name || "")
    .filter(Boolean);

  const prompt = `Bạn là trợ lý bếp công nghiệp người Việt Nam. Hãy gợi ý nguyên liệu cần thiết để sản xuất món: "${productName}".

Danh sách nguyên liệu hiện có trong kho: ${inventoryNames.length > 0 ? inventoryNames.join(", ") : "(chưa có dữ liệu kho)"}.

Yêu cầu:
- Gợi ý 5–10 nguyên liệu phù hợp với quy mô sản xuất bếp công nghiệp (số lượng lớn hơn nấu gia đình)
- Tên nguyên liệu bằng tiếng Việt
- Đơn vị chỉ dùng một trong: kg, g, lít, ml, cái
- Trả về JSON array thuần túy, không giải thích, không markdown

Định dạng mỗi phần tử:
{"name": "Tên nguyên liệu", "quantity": 0.5, "unit": "kg"}

Chỉ trả về JSON array.`;

  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API lỗi: ${resp.status}`);
  }

  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Extract JSON array from response (handles markdown fences if present)
  const match = rawText.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Phản hồi AI không hợp lệ, vui lòng thử lại.");

  const suggestions = JSON.parse(match[0]);

  // Match suggestions against inventory using fuzzy name comparison
  return suggestions.map((s) => {
    const suggestLower = (s.name || "").toLowerCase().trim();
    const found = inventoryItems.find((inv) => {
      const invLower = (inv.ingredientName || inv.name || "").toLowerCase().trim();
      return (
        invLower === suggestLower ||
        invLower.includes(suggestLower) ||
        suggestLower.includes(invLower)
      );
    });
    return {
      name: s.name,
      quantity: s.quantity,
      unit: s.unit,
      inInventory: !!found,
      ingredientId: found?.ingredientId ?? found?.id ?? null,
    };
  });
}
