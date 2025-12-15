<template>
    <div class="container">
        about page
        <div class="nested">Nested Less Style</div>
    </div>
</template>
<style lang="less">
    @bg-color: lightblue;
    
    body {
        background-color: @bg-color;
    }
    .container {
        color: red;
        font-size: 24px;
        font-weight: bold;
        
        .nested {
            color: blue;
            font-size: 16px;
        }
    }
</style>