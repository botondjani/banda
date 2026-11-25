-- Trigger-függvényeket senki ne hívhasson RPC-ként; a segédfüggvények csak belépve.
revoke execute on function public.handle_new_user, public.handle_new_program from public, anon, authenticated;
revoke execute on function public.is_group_member, public.is_group_owner, public.shares_group,
  public.program_group, public.activity_group from public, anon;
