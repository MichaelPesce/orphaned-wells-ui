import { AddNewUser, UsersPage, UpdateUserRoleButton, AssignUserRoles } from "@site/docs/screenshots";

export function AddUser() {
  return (
    <div>
      <p>
        Adding a user requires the <code>add_user</code> permission. Check that
        you have selected the intended team in the header before adding someone.
        Roles and their permissions can be customized by your administrator.
      </p>
      <ol>
        <li>
          Open <strong>Admin</strong> in the header and select <strong>Users</strong>.
          <UsersPage />
        </li>
        <li>
          Click <strong>+ Add user</strong> and enter the email address the person
          uses to sign in with Google.
          <AddNewUser />
        </li>
        <li>
          Click <strong>Submit</strong>. The Users table refreshes after a
          successful addition. New users receive the team member role for the
          current team; assign any additional roles as described below.
        </li>
      </ol>
    </div>
  );
}

export function UpdateRole() {
  return (
    <div>
      <p>
        Updating roles requires <code>manage_team</code> permission. Users can hold
        multiple roles. Team roles apply to the team currently selected in the
        header; system roles apply across teams.
      </p>
      <ol>
        <li>
          In the user's row, click the <strong>Update roles</strong> icon in
          the <strong>Actions</strong> column.
          <UpdateUserRoleButton />
        </li>
        <li>
          In <strong>Assign roles</strong>, click role chips to select or deselect
          them. Selected roles have a check mark. The <strong>System Roles</strong>
          {' '}section is available only with <code>system_administration</code>
          {' '}permission; <strong>Team Roles</strong> identifies the team being edited.
          <AssignUserRoles />
        </li>
        <li>
          Click <strong>Update Roles</strong> to save. Check the refreshed Users
          table to confirm the assignment.
        </li>
      </ol>
      <p>
        Administrators with <code>system_administration</code> permission can
        inspect and change what roles allow under <strong>Admin → Roles &amp;
        Permissions</strong>. Assigning a role to a user and changing a role's
        permissions are separate actions.
      </p>
    </div>
  );
}
