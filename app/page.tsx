import ListView from "@/components/ListView";

// The root page shares the layout's segment, so the title template does not apply here.
export const metadata = { title: { absolute: "Non-fiction · Books" } };

export default function NonFiction() {
  return <ListView list="learning" />;
}
