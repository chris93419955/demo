<template>
    <div class="hello">
        <h1>{{ msg }}</h1>
        <header class="im-chat-header">
            <div class="im-chat-user">
                <div class="im-chat-user-info">
                        <span class="im-chat-user-name" :title="recv.fromId">
                            {{ recv.fromId }} :
                        </span>
                    <span class="im-chat-user-remark" :title="recv.content">
                            {{ recv.content }}
                        </span>
                </div>
            </div>
            <div class="im-chat-warning" v-if="!webSocketIsOpen" v-html="webSocketWarningText"></div>
        </header>

        <footer class="im-chat-footer">
            <div class="im-chat-text-holder">
                <input type="text" placeholder="fromId" v-model="fromId">
            </div>
            <div class="im-chat-text-holder">
                <input type="text" placeholder="toId" v-model="toId">
            </div>
            <div class="im-chat-text-holder">
                <textarea placeholder="content" v-model="content"></textarea>
            </div>
            <div class="im-chat-send-box">
                <div class="im-chat-send">
                    <div class="im-chat-send-btn" @click="sendBtnClick">发送</div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script>
    import protoRoot from "@/proto/proto";

    const Message = protoRoot.lookup("Message");

    export default {
        name: 'HelloWorld',
        props: {
            msg: String,
            webSocketUrl: String,
            // 尝试重新连接的最大次数
            webSocketReconnectMaxCount: {
                type: Number,
                default: 5
            },
            // WebSocket 编码
            WSResEncode: {
                type: Function,
                default: function (payload) {
                    let errMsg = Message.verify(payload);
                    if (errMsg) {
                        console.log("buff 解析错误信息：", errMsg);
                    }
                    // Create a new message
                    const wsData = Message.create(payload);
                    // Encode a message to an Uint8Array (browser) or Buffer (node)
                    return Message.encode(wsData).finish();
                }
            },
            // WebSocket 编码
            WSResDecode: {
                type: Function,
                default: function (data, cb) {
                    let reader = new FileReader();
                    reader.readAsArrayBuffer(data);
                    reader.onload = () => {
                        const buf = new Uint8Array(reader.result);
                        const response = Message.decode(buf);
                        cb(response);
                    };
                }
            }

        },
        data() {
            return {
                recv: {},
                fromId: "",
                toId: "",
                content: "",
                webSocket: null,
                webSocketReconnectCount: 0,
                webSocketIsReconnect: true, // 是否重连
                webSocketWarningText:
                    "连接断开,正在尝试重连 <i class='dotting'></i>",
                webSocketIsOpen: false,
                // 心跳定时器
                webSocketPingTimer: null,
                webSocketPingTime: 10000, // 心跳的间隔，当前为 10秒,
            }
        },
        methods: {
            // 断开连接时
            webSocketClose() {
                // 修改状态为未连接
                this.webSocketIsOpen = false;
                this.webSocket = null;
                // 判断是否重连
                if (
                    this.webSocketIsReconnect &&
                    this.webSocketReconnectCount === 0
                ) {
                    // 第一次直接尝试重连
                    this.webSocketReconnect();
                }
            },
            // 定时心跳
            webSocketPing() {
                this.webSocketPingTimer = setTimeout(() => {
                    if (!this.webSocketIsOpen) {
                        return false;
                    }
                    console.log("发送客户端心跳");
                    const payload = {
                        cmd: 1
                    };
                    this.webSocketSend(payload);
                    clearTimeout(this.webSocketPingTimer);
                    // 重新执行
                    this.webSocketPing();
                }, this.webSocketPingTime);
            },
            webSocketInit() {
                this.webSocketWarningText = "连接断开,正在尝试重连 <i class='dotting'></i>";
                // 修改是否重连为 true
                this.webSocketIsReconnect = true;
                this.webSocket = new WebSocket(this.webSocketUrl);
                this.webSocket.onopen = this.webSocketHandleOpen;
                this.webSocket.onerror = this.webSocketHandleError;
                this.webSocket.onmessage = this.webSocketHandleMessage;
                this.webSocket.onclose = this.webSocketHandleClose;
            },
            // 发送ws消息
            webSocketSend(payload) {
                let buffer = this.WSResEncode(payload);
                this.webSocket.send(buffer);
            },
            // WebSocket 重连
            webSocketReconnect() {
                if (this.webSocketIsOpen) {
                    return false;
                }
                this.webSocketReconnectCount += 1;
                // 判断是否到了最大重连次数
                if (
                    this.webSocketReconnectCount >= this.webSocketReconnectMaxCount
                ) {
                    this.webSocketWarningText = "重连次数超限";
                    return false;
                }
                // 初始化
                this.webSocketInit();

                // 每过 5 秒尝试一次，检查是否连接成功，直到超过最大重连次数
                let timer = setTimeout(() => {
                    this.webSocketReconnect();
                    clearTimeout(timer);
                }, 5000);
            },
            // WebSocket 打开成功后
            webSocketHandleOpen() {
                console.log("连接打开");
                this.webSocketIsOpen = true;
                // 清空重连的次数
                this.webSocketReconnectCount = 0;
                // 发送登录信息
                const payload = {
                    cmd: 1
                };
                this.webSocketSend(payload);
                // 开启定时心跳
                this.webSocketPing();
            },
            // WebSocket 关闭
            webSocketHandleClose() {
                console.log("连接断开");
                // 关闭心跳
                this.webSocketClose();
            },
            // WebSocket 发生错误时
            webSocketHandleError(err) {
                console.log("连接报错：", err);
                // 关闭心跳
                this.webSocketClose();
            },
            // 接收到消息时
            webSocketHandleMessage(event) {
                // 响应体的message
                const data = event.data;
                this.WSResDecode(data, response => {
                    console.log("收到服务端消息:", response);
                    if (0 == response.cmd) {
                        this.recv = response;
                    }
                });
            },
            wsOut() {
                this.webSocketWarningText = "异地登录请重新登录";
                // 修改重连状态
                this.webSocketIsReconnect = false;
                if (this.webSocket) {
                    console.log("关闭websocket");
                    // 关闭 websocket
                    this.webSocket.close();
                }
            },
            sendBtnClick() {
                if (
                    !this.content || this.content === "" || /^[ ]+$/.test(this.content)
                ) {
                    return false;
                }
                let postData = {
                    fromId: this.fromId,
                    toId: this.toId,
                    content: this.content,
                    cmd: 0
                };
                this.webSocketSend(postData);
            }
        },
        created() {
            this.webSocketInit();
        },
        destroyed() {
            // 关闭 websocket 链接
            this.wsOut();
        }

    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .im-chat-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 140px;
        /*background-color: #fff;*/
        background-color: rgba(255, 255, 255, 0.9);
        box-shadow: 0 -1px 0 0 rgba(0, 0, 0, 0.04), 0 -2px 0 0 rgba(0, 0, 0, 0.01);
    }

    .im-chat-text-holder textarea {
        display: block;
        width: 100%;
        height: 65px;
        padding: 8px 10px;
        overflow-x: hidden;
        overflow-y: auto;
        resize: none;
        outline: 0;
        background: 0 0;
        border: 0;
        word-break: break-all;
        font-size: 13px;
        line-height: 17px;
        -webkit-appearance: none;
    }

    .im-chat-send-box {
        position: relative;
        height: 45px;
    }

    .im-chat-send {
        position: absolute;
        right: 15px;
        top: 3px;
        height: 32px;
        line-height: 32px;
        background: 0 0;
    }

    .im-chat-send-btn {
        background: 0 0;
        cursor: pointer;
        display: inline-block;
        vertical-align: top;
        font-size: 14px;
        line-height: 28px;
        margin-left: 5px;
        padding: 0 20px;
        background-color: #5fb878;
        color: #fff;
        border-radius: 3px;
    }
    .im-chat-user {
        cursor: default;
        display: flex;
        align-items: center;
    }
    .im-chat-user-avatar {
        flex: 0 0 auto;
        display: inline-block;
        width: 52px;
        height: 52px;
        border-radius: 26px;
        box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.1);
        vertical-align: middle;
    }
    .im-chat-user-info {
        display: inline-block;
        margin-left: 10px;
        vertical-align: middle;
        overflow: hidden;
    }
    .im-chat-user-name {
        display: inline-block;
        max-width: 160px;
        font-size: 14px;
    @include text-overflow;
    }
</style>
