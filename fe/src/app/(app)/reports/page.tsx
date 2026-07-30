import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ReportIcon } from "@/shared/ui/icons";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Báo cáo xuất - nhập - tồn theo sản phẩm và theo thời gian"
      />

      <Card>
        <EmptyState
          icon={<ReportIcon width={22} height={22} />}
          title="Chưa có dữ liệu báo cáo"
          description="Báo cáo sẽ hiển thị sau khi có dữ liệu hóa đơn nhập/xuất."
        />
      </Card>
    </div>
  );
}
