<script>
    let { question } = $props();
    
    // 响应式派生状态[1,8](@ref)
    let studentScore = $derived(question.student_score);
    let score = $derived(question.score);
    
    // 响应式样式计算[1,4](@ref)
    let styles = $derived.by(() => {
        if (studentScore === score) {
            return {
                bgColor: '#E8FFEA',
                iconBg: '#00B42A',
                textColor: '#00B42A',
                pointsColor: '#00B42A',
                icon: '✓',
                message: '回答正确'
            };
        } else if (studentScore > 0 && studentScore < score) {
            return {
                bgColor: '#FFE8ABFE',
                iconBg: '#ff7b00',
                textColor: '#ff7b00',
                pointsColor: '#ff7b00',
                icon: '✕',
                message: '回答含错'
            };
        } else {
            return {
                bgColor: '#F8D2D8',
                iconBg: '#F83D47',
                textColor: '#F83D47',
                pointsColor: '#F83D47',
                icon: '✕',
                message: '回答错误'
            };
        }
    });
    
    // 响应式分数文本[1,4](@ref)
    let pointsText = $derived(studentScore === score ? `+${score}分` : `+${0}分`);
</script>

{#if ['00', '02', '04'].includes(question.type)}
<div 
    class="feedback-container"
    style="background-color: {styles.bgColor}"
    tabindex="0"
    role="button"
>
    <div class="feedback-content">
        <div 
            class="icon-circle"
            style="background-color: {styles.iconBg}"
        >
            <span class="icon">{styles.icon}</span>
        </div>
        
        <span 
            class="feedback-message"
            style="color: {styles.textColor}"
        >
            {styles.message}
        </span>
        
        <span 
            class="points"
            style="color: {styles.pointsColor}"
        >
            {pointsText}
        </span>
    </div>
</div>
{:else if ['06', '08'].includes(question.type)}
<div 
    class="feedback-container"
    style="background-color: {styles.bgColor}"
>
    <div class="feedback-content">
        <span 
            class="feedback-message"
            style="color: {styles.textColor}"
        >
            得{studentScore}分  
        </span>
        <span 
            class="feedback-message"
            style="color: {styles.textColor}"
        >
            共{score}分
        </span>
    </div>
</div>
{/if}

<style scoped lang="scss">
  .feedback-container {
    border-radius: 8px;
    padding: 12px 10px;
    margin: 8px 0;
    width: 100%;
    height: 70px;
    align-items: center;
    text-align: center;
     margin-bottom: 40px;
  }
  
  .feedback-content {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: 6px;
   
  }
  
  .icon-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
    flex-shrink: 0;
    margin-right: 20px;
    
  }
  
  .icon {
    color: white;
    font-size: 20px;
    font-weight: bold;
    line-height: 1;
  }
  
  .feedback-message {
    font-size: 20px;
    font-weight: 500;
    margin-right: 20px;
  }
  
  .points {
    font-size: 20px;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  /* 响应式设计 */
  @media (max-width: 480px) {
    .feedback-container {
      padding: 10px 12px;
    }
    
    .feedback-content {
      gap: 10px;
    }
    
    .icon-circle {
      width: 28px;
      height: 28px;
    }
    
    .icon {
      font-size: 14px;
    }
    
    .message,
    .points {
      font-size: 14px;
    }
  }
</style>