<template>
    <div class="container">
        about page
        <div class="nested">
            Nested Less Style
        </div>
        <p>{{ message }}</p>
        <el-button>Default999</el-button>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { add } from '@/tools/operations';

const message = ref<string>('Hello from TypeScript!');
const sum = add(2, 3);
console.log(`2 + 3 = ${sum}`);
</script>

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