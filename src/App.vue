<template>
    <div id="app">
        <HelloWorld msg="测试websocket" web-socket-url="ws://127.0.0.1:9115/ws"/>
    </div>
</template>

<script>
    import HelloWorld from './components/HelloWorld.vue'




    export default {
        name: 'App',
        components: {
            HelloWorld
        },
        methods: {

        }
    }
</script>

<style>
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
