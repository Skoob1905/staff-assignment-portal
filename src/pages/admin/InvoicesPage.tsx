import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AccordionItem, ActionButton, Button } from "../../components/ui";
import {
  DialogContent,
  DialogRoot,
  DialogTitle,
} from "../../components/ui/dialog";
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal";
import { PaginatedFilterSection } from "../../views/Table";
import { useToast } from "../../context/ToastProvider";
import { useData } from "../../context/DataProvider";
import { usePaginationParams } from "../../hooks/usePaginationParams";
import { emptyFilters } from "../../types/domain";
import {
  deleteInvoice,
  markInvoicePaid,
  type InvoiceEntry,
} from "../../services/invoiceService";

interface ConfirmTarget {
  agencyId: string;
  invoiceId: string;
  fileName: string;
  clientName: string;
}

export const AdminInvoicesPage = () => {
  const { toast } = useToast();
  const {
    invoices: agencies,
    invoicesLoading: loading,
    refreshInvoices,
    markDownloaded,
  } = useData();
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [confirmPaid, setConfirmPaid] = useState<ConfirmTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConfirmTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { page, pageSize, setPage, setPageSize } = usePaginationParams();

  const flatInvoices = useMemo(
    () => agencies.flatMap((agency) => agency.invoices),
    [agencies],
  );
  const totalPages = Math.max(1, Math.ceil(flatInvoices.length / pageSize));
  const pagedInvoices = useMemo(
    () => flatInvoices.slice(page * pageSize, (page + 1) * pageSize),
    [flatInvoices, page, pageSize],
  );

  const handleMarkPaid = async (agencyId: string, invoiceId: string) => {
    setPayingInvoice(invoiceId);
    try {
      await markInvoicePaid(agencyId, invoiceId);
      toast({ title: "Invoice marked as paid", variant: "success" });
      refreshInvoices();
    } catch {
      toast({ title: "Failed to mark invoice as paid", variant: "error" });
    } finally {
      setPayingInvoice(null);
    }
  };

  const handleDelete = async (agencyId: string, invoiceId: string) => {
    setDeleting(true);
    try {
      await deleteInvoice(agencyId, invoiceId);
      toast({ title: "Invoice deleted", variant: "success" });
      refreshInvoices();
    } catch {
      toast({ title: "Failed to delete invoice", variant: "error" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col space-y-4">
      <PaginatedFilterSection<InvoiceEntry>
        title="Invoices"
        items={pagedInvoices}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalResults={flatInvoices.length}
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
          "Client",
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
                <span className="truncate text-xs text-[var(--muted-foreground)] sm:text-sm">
                  {invoice.agencyName || "—"}
                </span>,
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
                <span className="flex flex-wrap items-center gap-2">
                  <ActionButton
                    variant="download"
                    ariaLabel="Download invoice"
                    onClick={() => {
                      window.open(
                        invoice.fileUrl,
                        "_blank",
                        "noopener,noreferrer",
                      );
                      markDownloaded("invoices", invoice.agencyId, [
                        invoice.id,
                      ]).catch(() => {});
                    }}
                  />
                  {!isPaid && (
                    <ActionButton
                      variant="paid"
                      ariaLabel="Mark invoice as paid"
                      onClick={() =>
                        setConfirmPaid({
                          agencyId: invoice.agencyId,
                          invoiceId: invoice.id,
                          fileName: invoice.fileName,
                          clientName: invoice.agencyName,
                        })
                      }
                    />
                  )}
                  <ActionButton
                    variant="delete"
                    ariaLabel="Delete invoice"
                    onClick={() =>
                      setDeleteTarget({
                        agencyId: invoice.agencyId,
                        invoiceId: invoice.id,
                        fileName: invoice.fileName,
                        clientName: invoice.agencyName,
                      })
                    }
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

      <DialogRoot
        open={confirmPaid !== null}
        onOpenChange={(open) => !open && setConfirmPaid(null)}
      >
        <DialogContent
          onClose={() => setConfirmPaid(null)}
          closeDisabled={payingInvoice !== null}
        >
          <DialogTitle className="font-bold">
            Confirmation of Payment
          </DialogTitle>
          <p className="mt-3 text-sm text-zinc-600">
            This action cannot be undone without deleting and re-issuing the
            invoice.
          </p>
          <div className="mt-4 space-y-1 text-sm">
            <p>
              <span className="font-semibold">Invoice Name:</span>{" "}
              {confirmPaid?.fileName}
            </p>
            <p>
              <span className="font-semibold">Client:</span>{" "}
              {confirmPaid?.clientName}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              disabled={payingInvoice !== null}
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!confirmPaid) return;
                handleMarkPaid(confirmPaid.agencyId, confirmPaid.invoiceId);
                setConfirmPaid(null);
              }}
            >
              {payingInvoice !== null ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Marking...
                </span>
              ) : (
                "Mark as Paid"
              )}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>

      <DeleteConfirmModal
        open={deleteTarget !== null}
        deleting={deleting}
        label="invoice"
        itemName={deleteTarget?.fileName ?? ""}
        clientName={deleteTarget?.clientName ?? ""}
        onDelete={() => {
          if (!deleteTarget) return;
          void handleDelete(deleteTarget.agencyId, deleteTarget.invoiceId);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
