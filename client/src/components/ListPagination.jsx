export default function ListPagination({ pagination, onPageChange }) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="pagination" aria-label="List pagination">
      <span>
        Showing {pagination.firstItem}–{pagination.lastItem} of{" "}
        {pagination.totalItems}
      </span>
      <div>
        <button
          type="button"
          className="button button-outline button-small"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span aria-live="polite">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          type="button"
          className="button button-outline button-small"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
