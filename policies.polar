# HR Application Authorization Policies

# Define the User actor
actor User {}

# Define the Profile resource
resource Profile {
  roles = ["owner", "manager", "coworker", "ceo"];
  permissions = ["view_basic", "view_sensitive"];
  
  "view_basic" if "owner";
  "view_sensitive" if "owner";
  
  "view_basic" if "manager";
  "view_sensitive" if "manager";
  
  "view_basic" if "coworker";
  
  "view_basic" if "ceo";
  "view_sensitive" if "ceo";
}

# Helper rules for determining relationships
is_ceo(user: User) if
    has_role(user, "ceo", _company);

is_direct_report(manager: User, employee: User) if
    has_role(employee, "employee", manager);

is_indirect_report(manager: User, employee: User) if
    is_direct_report(manager, intermediate) and
    is_direct_report(intermediate, employee);

is_report(manager: User, employee: User) if
    is_direct_report(manager, employee);

is_report(manager: User, employee: User) if
    is_indirect_report(manager, employee);

# Same company check
same_company(user1: User, user2: User) if
    has_role(user1, "employee", company) and
    has_role(user2, "employee", company);

# Define the TimeOffRequest resource
resource TimeOffRequest {
  roles = ["owner", "approver"];
  permissions = ["view", "edit", "approve"];
  
  "view" if "owner";
  "edit" if "owner";
  
  "view" if "approver";
  "approve" if "approver";
}

# Helper rules for time-off request relationships
is_request_owner(owner: User, request: TimeOffRequest) if
    has_role(owner, "owner", request);

is_request_approver(approver: User, request: TimeOffRequest) if
    has_role(approver, "approver", request);

# Profile authorization rules
allow(actor: User, action: String, resource: Profile) if
    has_permission(actor, action, resource);

# TimeOffRequest authorization rules
allow(actor: User, action: String, resource: TimeOffRequest) if
    has_permission(actor, action, resource);