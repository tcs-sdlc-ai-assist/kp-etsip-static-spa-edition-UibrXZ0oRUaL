import PropTypes from 'prop-types';
import usePermission from '../../hooks/usePermission';

/**
 * Permission-gated rendering component.
 * Conditionally renders children based on the current persona's permission
 * for a given entity type and action.
 *
 * If the current persona does not have the required permission,
 * renders the fallback content (if provided) or nothing.
 *
 * @param {{ entityType: string, action: string, fallback?: React.ReactNode, children: React.ReactNode }} props
 * @returns {React.ReactElement|null}
 *
 * @example
 * <PermissionGate entityType="PORTFOLIO" action="edit">
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * <PermissionGate entityType="APPLICATION" action="delete" fallback={<span>No access</span>}>
 *   <DeleteButton />
 * </PermissionGate>
 */
const PermissionGate = ({ entityType, action, fallback, children }) => {
  const allowed = usePermission(entityType, action);

  if (!allowed) {
    return fallback || null;
  }

  return children;
};

PermissionGate.propTypes = {
  /** The entity type key (e.g., 'PORTFOLIO', 'APPLICATION'). */
  entityType: PropTypes.string.isRequired,
  /** The action to check permission for (e.g., 'view', 'create', 'edit', 'delete'). */
  action: PropTypes.string.isRequired,
  /** Optional fallback content to render when permission is denied. */
  fallback: PropTypes.node,
  /** Content to render when permission is granted. */
  children: PropTypes.node.isRequired,
};

PermissionGate.defaultProps = {
  fallback: null,
};

export default PermissionGate;