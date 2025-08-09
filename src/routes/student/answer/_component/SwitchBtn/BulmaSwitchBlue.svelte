
<script>

 let {is_full_examMode=$bindable()}=$props();
  let toggleExamMode=()=>{
    is_full_examMode=!is_full_examMode;
  }
</script>

<label class="switch">
  <input type="checkbox" checked={is_full_examMode} onclick={toggleExamMode}>
  <span class="slider"></span>
</label>


<style lang="scss" scoped>
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  width: 40px;
  height: 20px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 25px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #0336FF;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

</style>