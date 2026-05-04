import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

interface PaymentSuccessPageProps {
  params: { id: string };
  searchParams: { session_id?: string };
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PaymentSuccessPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600">支付成功！</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            感谢您的报名，我们期待与您相见！
          </p>

          {searchParams.session_id && (
            <div className="bg-gray-100 rounded p-3 text-xs text-gray-600 break-all">
              <div className="font-semibold mb-1">订单号：</div>
              {searchParams.session_id}
            </div>
          )}

          <div className="space-y-2 pt-4">
            <Link href={`/events/${params.id}`} className="block">
              <Button className="w-full">返回活动详情</Button>
            </Link>
            <Link href="/events" className="block">
              <Button variant="outline" className="w-full">
                浏览更多活动
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center">
            页面将在 3 秒后自动返回...
          </p>
        </CardContent>
      </Card>

      {/* Auto-redirect after 3 seconds */}
      <meta httpEquiv="refresh" content={`3;url=/events/${params.id}`} />
    </div>
  );
}
