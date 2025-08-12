export function onChooseStartTime(index, paper_configs, updateDuration) {
  return function (event) {
    const startDate = event.detail.date;
    if (startDate) {
      startDate.setSeconds(0, 0);
      paper_configs[index].startTime = startDate.toISOString();
      updateDuration(index);
    }
  };
}

export function onChooseEndTime(index, paper_configs, updateDuration) {
  return function (event) {
    const endDate = event.detail.date;
    if (endDate) {
      endDate.setSeconds(0, 0);
      paper_configs[index].endTime = endDate.toISOString();
      updateDuration(index);
    }
  };
}