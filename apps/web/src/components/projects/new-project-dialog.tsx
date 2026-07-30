"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { primaryControl } from "../workspace/controls";
import { NewProjectForm } from "./new-project-form";

export function NewProjectDialog({
  label = "New project",
  submissionToken,
}: {
  label?: string;
  submissionToken: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        className={primaryControl}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus aria-hidden="true" size={15} strokeWidth={1.75} />
        {label}
      </button>

      <dialog
        aria-labelledby="new-project-dialog-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[880px] overflow-y-auto rounded-xl border border-rule bg-paper p-0 text-ink shadow-2xl backdrop:bg-brand-black/55 backdrop:backdrop-blur-[2px]"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            close();
          }
        }}
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        {open && (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule bg-paper px-5 py-4 md:px-6">
              <div>
                <h2
                  className="font-heading text-xl font-bold tracking-[-0.025em]"
                  id="new-project-dialog-title"
                >
                  New project
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Add the basic site details.
                </p>
              </div>
              <button
                aria-label="Close new project form"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-rule-strong bg-paper text-ink-muted transition-colors hover:border-ink hover:bg-paper-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={close}
                type="button"
              >
                <X aria-hidden="true" size={18} strokeWidth={1.75} />
              </button>
            </div>
            <NewProjectForm
              embedded
              onCancel={close}
              submissionToken={submissionToken}
            />
          </>
        )}
      </dialog>
    </>
  );
}
