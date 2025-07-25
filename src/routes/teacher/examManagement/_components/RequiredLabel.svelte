<script>
    export let text = '';
    export let Asterisk = true; // 控制是否显示星号，默认显示
    export let colon = true; // 默认显示冒号
</script>

<div class="labelContainer">
    <span class="labelText">
        {#if Asterisk}
            <span class="requiredIcon">*</span>
        {/if}
        {text}
    </span>
    <span class="colon">
        {#if colon}
            ：
        {/if}
    </span>
</div>

<style scoped>
    .labelContainer {
        display: flex;
        align-items: center;
        font-size: 14px;
        width: 120px;
    }

    .labelText {
        white-space: wrap;
        overflow: hidden;
        text-overflow: clip;
        text-align: right;
        flex: 1;
    }

    .requiredIcon {
        margin-right: 2px;
        color:var(--red)
    }

    .colon {
        margin-left: 2px;
    }
</style>