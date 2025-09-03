export function load({ params }) {
  return {
    idCardNo: params.personId,
    enrollId: parseInt(params.seeEnrollId),
  };
}
