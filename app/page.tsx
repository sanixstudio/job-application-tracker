import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <Button variant="secondary">Click me</Button>
      <Button variant="default">Click me</Button>
      <Button variant="destructive">Click me</Button>
      <Button variant="outline">Click me</Button>
      <Button variant="ghost">Click me</Button>
      <Button variant="link">Click me</Button>
    </div>
  );
}
