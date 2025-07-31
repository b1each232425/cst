export function load({ cookies }) {
  const qNearSessions = cookies.get('qNearSessions');
  const token = cookies.get('token');

  return {
    data: {
      qNearSessions,
      token,
    },
  };
}
