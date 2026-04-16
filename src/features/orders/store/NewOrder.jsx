import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import { Button, Card, Badge } from "../../../components/ui";
import { Input, Textarea } from "../../../components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";
import toast from "react-hot-toast";
import "./NewOrder.css";

export default function NewOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, stores, orders, addOrder, formatCurrency } = useData();
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const priority = useMemo(() => {
    if (!requestedDate) return "normal";
    const diffHours = (new Date(requestedDate) - new Date()) / (1000 * 60 * 60);
    if (diffHours <= 12) return "high";
    if (diffHours >= 7 * 24) return "low";
    return "normal";
  }, [requestedDate]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [errors, setErrors] = useState({});

  const categories = ["all", ...new Set(products.map((p) => p.category))];
  const filtered =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 10 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 10,
          unit: product.unit,
          price: product.price,
        },
      ];
    });
    if (errors.cart) setErrors((prev) => ({ ...prev, cart: null }));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const validate = () => {
    const errs = {};
    if (cart.length === 0) errs.cart = "Vui lòng chọn ít nhất 1 sản phẩm";
    if (!requestedDate) errs.requestedDate = "Vui lòng chọn ngày giao";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const store = stores.find((s) => s.id === user.store);
    const newOrder = {
      id: `DH${String(orders.length + 1).padStart(3, "0")}`,
      storeId: user.store,
      storeName: store?.name || user.store,
      kitchenId: "BT001",
      status: "pending",
      priority,
      createdAt: new Date().toISOString(),
      requestedDate,
      notes,
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.price,
      })),
      createdBy: user.name,
      total,
    };
    addOrder(newOrder);
    toast.success(
      `Đơn hàng đã được tạo thành công! Tổng: ${formatCurrency(total)}`,
    );
    navigate("/store/orders");
  };

  return (
    <PageWrapper
      title="Tạo đơn hàng mới"
      subtitle="Chọn sản phẩm và số lượng cần đặt từ bếp trung tâm"
      actions={
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate("/store/orders")}
        >
          Quay lại
        </Button>
      }
    >
      <div className="new-order-layout">
        {/* Product selection */}
        <div className="new-order-products">
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid",
                  borderColor:
                    selectedCategory === cat
                      ? "var(--primary)"
                      : "var(--surface-border)",
                  background:
                    selectedCategory === cat
                      ? "var(--primary-bg)"
                      : "var(--surface-card)",
                  color:
                    selectedCategory === cat
                      ? "var(--primary)"
                      : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  textTransform: "capitalize",
                }}
              >
                {cat === "all" ? "Tất cả" : cat}
              </button>
            ))}
          </div>

          {errors.cart && (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--danger-bg)",
                color: "var(--danger)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              {errors.cart}
            </div>
          )}

          <div className="product-grid">
            {filtered.map((product) => {
              const inCart = cart.find((i) => i.productId === product.id);
              return (
                <div
                  key={product.id}
                  className={`product-card ${inCart ? "product-card--selected" : ""}`}
                  onClick={() => addToCart(product)}
                >
                  <div className="product-card__img">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <ShoppingCart size={24} />
                    )}
                  </div>
                  <div className="product-card__info">
                    <h4 className="product-card__name">{product.name}</h4>
                    <Badge variant="neutral">{product.category}</Badge>
                    <p className="product-card__price">
                      {formatCurrency(product.price)} / {product.unit}
                    </p>
                  </div>
                  {inCart && (
                    <div className="product-card__qty-badge">
                      {inCart.quantity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart sidebar */}
        <div className="new-order-cart">
          <Card>
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-lg)",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Giỏ hàng ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  textAlign: "center",
                  padding: "16px 0",
                }}
              >
                Chọn sản phẩm bên trái để thêm vào giỏ
              </p>
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item__info">
                      <p className="cart-item__name">{item.productName}</p>
                      <p className="cart-item__price">
                        {formatCurrency(item.price)} / {item.unit}
                      </p>
                    </div>
                    <div className="cart-item__controls">
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.productId, -5)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.productId, 5)}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        className="cart-remove-btn"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="cart-item__subtotal">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid var(--surface-border)",
                paddingTop: "16px",
                marginTop: "16px",
              }}
            >
              <Input
                label="Ngày yêu cầu giao"
                type="date"
                value={requestedDate}
                onChange={(e) => {
                  setRequestedDate(e.target.value);
                  if (errors.requestedDate)
                    setErrors((prev) => ({ ...prev, requestedDate: null }));
                }}
                required
                error={errors.requestedDate}
              />
              {requestedDate && (
                <div style={{ marginTop: "12px" }}>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--text-primary)", marginBottom: "6px" }}>
                    Mức độ ưu tiên (tự động)
                  </p>
                  <Badge variant={priority === "high" ? "danger" : priority === "low" ? "neutral" : "info"}>
                    {priority === "high" ? "Gấp" : priority === "low" ? "Thấp" : "Bình thường"}
                  </Badge>
                </div>
              )}
              <div style={{ marginTop: "12px" }}>
                <Textarea
                  label="Ghi chú"
                  placeholder="Ghi chú cho bếp trung tâm..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--surface-border)",
                paddingTop: "16px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                <span>Tổng cộng:</span>
                <span
                  style={{
                    color: "var(--primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatCurrency(total)}
                </span>
              </div>
              <Button
                style={{ width: "100%" }}
                disabled={cart.length === 0}
                onClick={handleSubmit}
              >
                Gửi đơn hàng
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
