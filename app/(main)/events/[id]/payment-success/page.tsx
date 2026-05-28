import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { RedirectCountdown } from "@/components/events/RedirectCountdown";

interface PaymentSuccessPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PaymentSuccessPageProps) {
  const { id } = await params;
  const { session_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600">支付成功！</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-[#B8A099]">
            感谢您的报名，我们期待与您相见！
          </p>

          {session_id && (
            <div className="bg-[#FFF5F3] rounded p-3 text-xs text-[#B8A099] break-all">
              <div className="font-semibold mb-1">订单号：</div>
              {session_id}
            </div>
          )}

          <div className="space-y-2 pt-4">
            <Link href={`/events/${id}`} className="block">
              <Button className="w-full">返回活动详情</Button>
            </Link>
            <Link href="/events" className="block">
              <Button variant="outline" className="w-full">
                浏览更多活动
              </Button>
            </Link>
          </div>

          <RedirectCountdown targetUrl={`/events/${id}`} seconds={3} />
        </CardContent>
      </Card>
    </div>
  );
}
