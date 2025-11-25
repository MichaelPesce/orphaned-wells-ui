import { AddNewUser, UsersPage, UpdateUserRoleButton } from "@site/docs/screenshots";

export function AddUser() {
  return (
    <div>
            To add a user, you must have the <code>sys_admin</code> or <code>team_lead</code> role. By default, if using the <code>initializeMongoDB.py</code> script, the first user created will have the <code>sys_admin</code> role. 
      <ol>
        <li>
                    Navigate to the Users tab on the header:
          {UsersPage()}
        </li>
        <li>
                    Click add user and enter new email address (note: <i>users must have a Gmail or a Google Workspace account</i>):
          {AddNewUser()}
        </li>
      </ol>
    </div>
  );
}

export function UpdateRole() {
  return (
    <div>
      <ol>
        <li>
                    To update a user's role, click the update role button pictured below, and select from the available roles. Note: team leads have additional privileges over team members, including adding new users, uploading documents, and verifying document integrity.
          {UpdateUserRoleButton()}
        </li>
      </ol>
    </div>
  );
}