<script>
  import { onMount, onDestroy } from "svelte";

  let {
    onComplete,
    ifPreview,
    init_total_seconds,
    init_end_time,
    examinee_id,
    practice_submission_id = 0,
    elapsed_seconds = 0, //练习模式中正着数开始的秒数
    countUp = false, //标记是正着数还是倒数
    start_timestamp = Date.now(), //正着数需要的开始时间戳，用于和后端对时
  } = $props();


  /**
   * @type {WebSocket|null}
   */
  let ws = null;
  let current_seconds = $state(
    countUp ? elapsed_seconds : init_total_seconds || 0
  );
  let time_display = $state("00:00:00");

  /**
   * @type {ReturnType<typeof setInterval> | undefined}
   */
  let interval_id;
  let end_time = $state(init_end_time);

  let is_less_than_5minutes = $derived(!countUp && current_seconds <= 300);

  /**
   * @param {number}seconds
   */
  function formatTime(seconds) {
    const total = Math.floor(seconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = total % 60;
    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  }

  function startTimer() {
    if (interval_id) return;

    interval_id = setInterval(() => {
      if (countUp) {
        current_seconds += 1;
      } else {
        if (current_seconds <= 0) {
          clearInterval(interval_id);
          onComplete();
          return;
        }
        if (current_seconds < 10) {
          try {
            ws?.send(JSON.stringify({ type_num: 1 }));
          } catch (e) {
            console.log("发送失败:", e);
          }
        }
        current_seconds -= 1;
      }

      time_display = formatTime(current_seconds);
    }, 1000);
  }

  function openWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    let url = `${protocol}://${window.location.host}/api/time-sync?`;

    if (examinee_id) {
      url += `examinee_id=${examinee_id}`;
    } else {
      url += `practice_submission_id=${practice_submission_id}`;
    }
    ws = new WebSocket(url);

    ws.onopen = () => {
   //   console.log("WebSocket opened");
    };
    

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.msg_type) {
        case 1: // 服务器时间戳消息
          const now_ts = data.timestamp;
          if (countUp) {
            current_seconds =
              Math.floor((now_ts - start_timestamp) / 1000) + elapsed_seconds;
          } else {
            current_seconds = Math.floor((end_time - now_ts) / 1000);
          }
          break;
        case 2: // 重置结束时刻消息
          const new_end_time = data.end_time;
          if (new_end_time) {
            end_time = new_end_time;
            if (!countUp) {
              current_seconds = Math.floor((end_time - Date.now()) / 1000);
            }
          }
          break;
        default:
          console.warn("Unknown message type:", data.type_num);
          break;
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };
  }

  onMount(() => {
    if (ifPreview) {
      console.log("预览模式");
      return;
    }
    openWebSocket();
    startTimer();
  });

  $effect(() => {
    time_display = formatTime(current_seconds);
    is_less_than_5minutes = !countUp && current_seconds <= 300;
  });

  onDestroy(() => {
    if (interval_id) clearInterval(interval_id);
    if (ws) ws.close();
  });
</script>

<div class="exam-timer" class:warning={is_less_than_5minutes}>
  {time_display}
</div>

<style lang="scss" scoped>
  .exam-timer {
    font-size: 20px;
    font-weight: bold;
    color: #0336ff;
    padding: 0 5px;

    &.warning {
      color: #ff0000;
    }
  }
</style>
