import { useEffect, useMemo, useRef } from "react";
import { AccordionItem, ActionButton } from "../../components/ui";
import { PaginatedFilterSection } from "../../views/Table";
import { useAuth } from "../../context/AuthProvider";
import { useData } from "../../context/DataProvider";
import { usePaginationParams } from "../../hooks/usePaginationParams";
import { emptyFilters } from "../../types/domain";
import type { InvoiceEntry } from "../../services/invoiceService";

export const InvoicesPage = () => {
  const { appUser } = useAuth();
  const {
    invoices,
    invoicesLoading: loading,
    markSeen,
    markDownloaded,
  } = useData();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myInvoices = useMemo(
    () => invoices.flatMap((a) => a.invoices),
    [invoices],
  );

  useEffect(() => {
    if (!loading && appUser?.agencyId && myInvoices.length > 0) {
      const unseenIds = myInvoices
        .filter((inv) => inv.hasSeen === false)
        .map((inv) => inv.id);

      if (unseenIds.length > 0) {
        timerRef.current = setTimeout(() => {
          markSeen("invoices", appUser.agencyId!, unseenIds).catch(() => {});
        }, 3000);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loading, appUser?.agencyId, myInvoices, markSeen]);

  const { page, pageSize, setPage, setPageSize } = usePaginationParams();
  const totalPages = Math.max(1, Math.ceil(myInvoices.length / pageSize));
  const pagedInvoices = useMemo(
    () => myInvoices.slice(page * pageSize, (page + 1) * pageSize),
    [myInvoices, page, pageSize],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col space-y-4">
      <PaginatedFilterSection<InvoiceEntry>
        title="Invoices"
        items={pagedInvoices}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalResults={myInvoices.length}
        pageSize={pageSize}
        onPrevPage={() => setPage(Math.max(0, page - 1))}
        onNextPage={() => setPage(page + 1)}
        onGoToPage={setPage}
        onPageSizeChange={setPageSize}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        enableNameFilter={false}
        enableTagFilter={false}
        columnHeaders={[
          "Name",
          "Amount",
          "Sent On",
          "Due On",
          "Status",
          "Actions",
        ]}
        emptyMessage="No invoices found."
        renderItem={(invoice, idx) => {
          const isPaid = invoice.status === "paid";
          const amount = parseFloat(invoice.amountPayable).toFixed(2);
          const sentOn = new Date(invoice.uploadedAt).toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "short", year: "numeric" },
          );
          const dueOn = new Date(invoice.dueDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <AccordionItem
              key={invoice.id}
              value={invoice.id}
              className="animate-cascade"
              style={{ animationDelay: `${idx * 5}ms` } as React.CSSProperties}
              columns={[
                <span className="tabular-nums">{idx + 1}</span>,
                <span className="truncate">{invoice.fileName}</span>,
                <span className="truncate text-sm font-medium">£{amount}</span>,
                <span className="truncate text-xs text-[var(--muted-foreground)] sm:text-sm">
                  {sentOn}
                </span>,
                <span className="truncate text-xs text-[var(--muted-foreground)] sm:text-sm">
                  {dueOn}
                </span>,
                <span
                  className={`truncate font-medium ${
                    isPaid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPaid ? "Paid" : "Not Paid"}
                </span>,
                <span className="flex items-center gap-2">
                  <ActionButton
                    variant="download"
                    ariaLabel="Download invoice"
                    onClick={() => {
                      window.open(
                        invoice.fileUrl,
                        "_blank",
                        "noopener,noreferrer",
                      );
                      markDownloaded("invoices", appUser?.agencyId ?? "", [
                        invoice.id,
                      ]).catch(() => {});
                    }}
                  />
                </span>,
              ]}
            >
              <div className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                Sent {sentOn} · Due {dueOn}
              </div>
            </AccordionItem>
          );
        }}
      />
    </div>
  );
};
