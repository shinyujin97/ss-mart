import { redirect } from "next/navigation";

export const metadata = { title: "제품 문의 | 에스에스종합상사" };

export default function CheckoutPage() {
  redirect("/cart");
}
