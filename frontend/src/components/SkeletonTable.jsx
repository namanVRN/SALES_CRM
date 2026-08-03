// src/components/SkeletonTable.jsx
function SkeletonTable({ rowsCount = 8 }) {
  return (
    <div className="p-4">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>
                <div className="skeleton-line w-75"></div>
              </th>
              <th style={{ width: "25%" }}>
                <div className="skeleton-line w-60"></div>
              </th>
              <th style={{ width: "25%" }}>
                <div className="skeleton-line w-70"></div>
              </th>
              <th className="text-center" style={{ width: "20%" }}>
                <div className="skeleton-line w-50 mx-auto"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowsCount }).map((_, i) => (
              <tr key={i}>
                <td>
                  <div className="d-flex align-items-center gap-3">
                    <div className="skeleton-circle"></div>
                    <div className="flex-grow-1">
                      <div className="skeleton-line w-100 mb-2"></div>
                      <div className="skeleton-line w-60"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="skeleton-line w-80"></div>
                </td>
                <td>
                  <div className="skeleton-line w-70"></div>
                </td>
                <td className="text-center">
                  <div className="skeleton-button mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SkeletonTable;