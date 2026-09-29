import { useEffect, useMemo, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { AccordionItem, ActionButton } from "../../components/ui";
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal";
import { PaginatedFilterSection } from "../../views/Table";
import { useToast } from "../../context/ToastProvider";
import { useData } from "../../context/DataProvider";
import { usePaginationParams } from "../../hooks/usePaginationParams";
import { useAccordionParams } from "../../hooks/useAccordionParams";
import { emptyFilters } from "../../types/domain";
import { functions } from "../../services/firebase";
import {
  formatTimesheetDate,
  getLatestTimesheetUpload,
  type AgencyTimesheets,
  type TimesheetEntry,
} from "../../utils/timesheets";

interface DeleteTarget {
  clientId: string;
  clientName: string;
  entry: TimesheetEntry;
}

export const AdminTimesheetsPage = () => {
  useEffect(() => {
    document.title = "Timesheets";
  }, []);

  const { toast } = useToast();
  const {
    timesheets: agencies,
    timesheetsLoading: loading,
    refreshTimesheets,
    markSeen,
    markDownloaded,
  } = useData();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { openValues, handleAccordionChange } = useAccordionParams();

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of Object.values(timers)) {
        clearTimeout(t);
      }
    };
  }, []);

  // Mark an agency's timesheets as seen once its row is expanded.
  useEffect(() => {
    const current = new Set(openValues);

    for (const agencyId of Object.keys(timersRef.current)) {
      if (!current.has(agencyId)) {
        clearTimeout(timersRef.current[agencyId]);
        delete timersRef.current[agencyId];
      }
    }

    for (const agencyId of openValues) {
      if (timersRef.current[agencyId]) continue;

      timersRef.current[agencyId] = setTimeout(() => {
        delete timersRef.current[agencyId];
        const agency = agencies.find((a) => a.agencyId === agencyId);
        if (!agency) return;
        const unseen = agency.timesheets
          .filter((ts) => ts.hasSeen === false)
          .map((ts) => ts.fileName);
        if (unseen.length > 0) {
          markSeen("timesheets", agencyId, unseen).catch(() => {});
        }
      }, 1500);
    }
  }, [openValues, agencies, markSeen]);

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const fn = httpsCallable(functions, "deleteTimesheet");
      await fn({
        clientId: deleteTarget.clientId,
        fileName: deleteTarget.entry.fileName,
      });
      toast({ title: "Timesheet deleted", variant: "success" });
      setDeleteTarget(null);
      refreshTimesheets();
    } catch {
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const { page, pageSize, setPage, setPageSize } = usePaginationParams();
  const totalPages = Math.max(1, Math.ceil(agencies.length / pageSize));
  const pagedAgencies = useMemo(
    () => agencies.slice(page * pageSize, (page + 1) * pageSize),
    [agencies, page, pageSize],
  );

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <PaginatedFilterSection<AgencyTimesheets>
        title="Timesheets"
        items={pagedAgencies}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalResults={agencies.length}
        pageSize={pageSize}
        onPrevPage={() => setPage(Math.max(0, page - 1))}
        onNextPage={() => setPage(page + 1)}
        onGoToPage={setPage}
        onPageSizeChange={setPageSize}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        enableNameFilter={false}
        enableTagFilter={false}
        expandable
        accordionType="multiple"
        multiAccordionValue={openValues}
        onMultiAccordionChange={handleAccordionChange}
        columnHeaders={[
          "Name",
          "Last timesheet sent",
          "Number of timesheets sent",
          "Actions",
        ]}
        emptyMessage="No timesheets uploaded yet."
        renderItem={(agency, idx) => {
          const latest = getLatestTimesheetUpload(agency.timesheets);

          return (
            <AccordionItem
              key={agency.agencyId}
              value={agency.agencyId}
              className="animate-cascade"
              style={{ animationDelay: `${idx * 5}ms` } as React.CSSProperties}
              columns={[
                <span className="tabular-nums">{idx + 1}</span>,
                <span className="truncate">{agency.agencyName}</span>,
                <span className="text-xs text-[var(--muted-foreground)] sm:text-sm">
                  {latest ? formatTimesheetDate(latest.uploadedAt) : "—"}
                </span>,
                <span className="text-xs text-[var(--muted-foreground)] sm:text-sm">
                  {agency.timesheets.length}
                </span>,
                <span
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {latest && (
                    <>
                      <ActionButton
                        variant="download"
                        ariaLabel="Download latest timesheet"
                        onClick={() => {
                          window.open(
                            latest.fileUrl,
                            "_blank",
                            "noopener,noreferrer",
                          );
                          markDownloaded("timesheets", agency.agencyId, [
                            latest.fileName,
                          ]).catch(() => {});
                        }}
                      />
                      <ActionButton
                        variant="delete"
                        ariaLabel="Delete latest timesheet"
                        onClick={() =>
                          setDeleteTarget({
                            clientId: agency.agencyId,
                            clientName: agency.agencyName,
                            entry: latest,
                          })
                        }
                      />
                    </>
                  )}
                </span>,
              ]}
            >
              <div className="flex flex-col divide-y divide-[var(--border)]">
                {agency.timesheets.map((entry) => (
                  <div
                    key={entry.fileName}
                    className="flex items-center gap-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs sm:text-sm">
                      {entry.fileName}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--muted-foreground)] sm:text-sm">
                      {formatTimesheetDate(entry.uploadedAt)}
                    </span>
                    <ActionButton
                      variant="download"
                      ariaLabel={`Download ${entry.fileName}`}
                      onClick={() => {
                        window.open(
                          entry.fileUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                        markDownloaded("timesheets", agency.agencyId, [
                          entry.fileName,
                        ]).catch(() => {});
                      }}
                    />
                    <ActionButton
                      variant="delete"
                      ariaLabel={`Delete ${entry.fileName}`}
                      onClick={() =>
                        setDeleteTarget({
                          clientId: agency.agencyId,
                          clientName: agency.agencyName,
                          entry,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </AccordionItem>
          );
        }}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        deleting={deleting}
        label="timesheet"
        itemName={deleteTarget?.entry.fileName ?? ""}
        clientName={deleteTarget?.clientName ?? ""}
        onDelete={() => void onDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
