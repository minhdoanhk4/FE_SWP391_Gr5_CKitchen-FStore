export default function Logo({ size = 32, className = "" }) {
  return (
    <img
      src="/images/products/logo.png"
      alt="CKitchen Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
