import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ✅ Navbar search → page opens → scroll to that lead's row in the table and highlight it.
// Table row needs: data-lead-id={r.uniqueId}
export default function useSearchHighlight(rows) {
  const location = useLocation();
  const highlightLeadId = location.state?.highlightLeadId || null;
  const fromSearch = location.state?.fromSearch || false;
  const searchAt = location.state?.searchAt || 0;

  useEffect(() => {
    if (!highlightLeadId || !fromSearch || !rows || rows.length === 0) return;

    const safeId = String(highlightLeadId).replace(/"/g, '\\"');
    let tries = 0;
    let findTimer;
    let removeTimer;

    // Table may render a little late → try every 300 ms (max ~3 sec)
    const tryHighlight = () => {
      const targetRow = document.querySelector(`[data-lead-id="${safeId}"]`);
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRow.classList.add("search-highlight-row");
        removeTimer = setTimeout(() => {
          targetRow.classList.remove("search-highlight-row");
        }, 4000);
        return;
      }
      if (++tries < 10) findTimer = setTimeout(tryHighlight, 300);
    };
    findTimer = setTimeout(tryHighlight, 300);

    return () => {
      clearTimeout(findTimer);
      clearTimeout(removeTimer);
    };
  }, [rows, highlightLeadId, fromSearch, searchAt]);
}