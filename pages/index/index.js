import {CrsClient} from "./crsClient";
import {createScopedThreejs} from 'threejs-miniprogram'

// const { renderModel, onClick } = require('./test-cases/cube')
const { renderModel, onClick } = require('./test-cases/model')

const systemInfo = wx.getSystemInfoSync();

const SELECT_TYPE = {
    NONE: 0,
    IMAGE: 1,
    VIDEO: 2,
};

Page({
    data: {
        showOverlay: true,
        showSelect: false,
        SELECT_TYPE: SELECT_TYPE,
        selectType: 0,
        showModal: false,

        //CRS配置
        config: {
            token: "BuNNwov8NzSJhAQ0oRU58xd7QEDecc+oh8FCkb8HYRR7wkJLusOptnSLmxelQ8Exq/xkR6MO+AykxOgEa5Fn1p5Hg8ZwrhwgvvY256e1DHM/YJHfVA/MBdKBrESgZRowJzd4qzlYA9Ibx6ths/rm5NqP++4TrV/IY9XzTuEv22n8jB1bk0/Z5Mx+J2SK7xNek/ewdz4AuBCA1783j7V6vg13g+ks3hdiZSWh67Z0xS57iY8xKK0Tbp5LwpjkMYNsiJfi4scT8xLcqKFKt5/dEMQAaBlFR0Ih8Lu9HLJMa4u8Q/YutUA66yvM3BfuJmSyG9kM2vOknp6104ibHbrUDLF7o8tpsPAEf1g2LAb60Lz+efnVtimzgM6oTnGRGHeneODl6R9EuYUk/DfxYLYGHy/kEx9RH7VdlCfavYhSKYm9Eqm2FDeZR7sQ/DFquRQcoZrEAoGNz7WddRy1KAcmFA==",
            cloudKey: "9277851aa0b826d2cb7300ddfc974896",
            clientHost: 'https://cn1-crs.easyar.com:8443', //服务器一般不变
            jpegQuality: 0.7, //JPEG压缩质量，建议不低于70%
            minInterval: 1000, //最短的两次CRS请求间隔
        },
        //识别到这个数组中的ID就触发内容
        targetIds: [
            "18c34c39-c843-4999-aff3-ab04c470f9a4",
            "c55bc78f-b7c7-47fd-bdde-fe50a9e85d69",
            "02fa9723-4cde-4dad-8548-4148d8432c15"
        ],

        showLoading: false,
        showLoadingText: "",
    },

    /** @type {CameraFrameListener} 相机帧回调 */
    listener: undefined,
    /** @type {HTMLCanvasElement} canvas对象 */
    canvas: undefined,

    /** @type {boolean} 是否需要持续识别，在点击“识别体验”之后和识别成功之前为true */
    runningCrs: undefined,
    /** @type {boolean} 当前是否正在进行CRS请求 */
    busy: undefined,
    /** @type {CrsClient} 负责发起CRS请求的对象 */
    crsClient: undefined,
    /** @type {number} 最后一次CRS请求的事件，用于判断是否满足最短请求间隔 */
    last: undefined,

    onLoad: function () {
        // this.showModal()
    },
    onReady: function () {
        if (systemInfo.platform === "devtools") { //开发工具不会触发initdone事件，于是在onReady手动触发
            this.onCameraInit();
        }
    },
    openApp() {
        wx.navigateTo({
          url: '/pages/landpage/landpage',
        })
    },
    onWebglClick(e) {
        onClick(e, () => {
            this.openApp()
        })
    },
    // 展示模型
    showModal() {
        this.setData({
            showModal: true
        });
        wx.createSelectorQuery()
        .select('#webgl')
        .node()
        .exec((res) => {
            const canvas = res[0].node
            // 创建一个与 canvas 绑定的 three.js
            const THREE = createScopedThreejs(canvas)
            // 传递并使用 THREE 变量
            renderModel(canvas, THREE)
        })
    },
    showLoading(text) {
        this.setData({
            showLoading: true,
            showLoadingText: text,
        });
    },
    hideLoading() {
        this.setData({
            showLoading: false,
        });
    },

    //图像识别部分：

    onShow: function () {
        if (this.listener) this.listener.start(); //页面隐藏时相机帧的监听会自动停止，但恢复展示时不会自动启动，这里手动启动
    },

    onCameraInit: function () {
        //找到canvas对象
        const query = wx.createSelectorQuery();
        query.select('#capture')
            .fields({node: true})
            .exec((res) => {
                const canvas = res[0].node;
                //设置canvas内部尺寸为480*640，frame-size="medium"的设置下相机帧大多是480*640
                canvas.width = 480;
                canvas.height = 640;
                this.canvas = canvas;

                this.crsClient = new CrsClient(this.data.config, this.canvas);

                //开始监听相机帧
                let cameraContext = wx.createCameraContext();
                this.listener = cameraContext.onCameraFrame(frame => {
                    if (!this.canvas) return;
                    let canvas = this.canvas;
                    //如果尺寸不匹配，就修改canvas尺寸以适应相机帧
                    if (canvas.width !== frame.width || canvas.height !== frame.height) {
                        canvas.width = frame.width;
                        canvas.height = frame.height;
                    }

                    this.queryImage(frame);
                });
                this.listener.start();
            });
    },

    queryImage: function (frame) {
        if (!this.runningCrs || this.busy || !this.crsClient) return;

        //最短的两次CRS请求间隔
        let now = new Date().getTime();
        if (this.last && (now - this.last < this.data.config.minInterval)) return;
        this.last = now;

        this.busy = true; //如果正在进行CRS请求，就不允许再次请求

        this.crsClient.queryImage(frame).then(res => {
            if (!this.runningCrs) return; //避免在停止后仍然触发
            let result = res && res.result;
            if (!result) return;
            
            if (result.target) {
                console.log("识别成功", result.target.targetId);
                //如果待触发的id列表中存在识别到的这个id，就触发
                if (this.data.targetIds.find(targetId => targetId === result.target.targetId)) {
                    this.onResult(result.target);
                }
            } else {
                console.log("识别失败", result.message);
            }
            this.busy = false;
        }).catch(e => {
            this.busy = false;
            console.log(e);
        }); //小程序iOS端不支持finally，所以在then和catch里分别设置busy = false
    },

    onResult: function (target) {
        this.runningCrs = false;
        this.hideLoading();
        console.log("触发内容!");
        if (target.meta) {
            console.log("meta base64:", target.meta);
        }
        this.setData({
            showOverlay: false,
            showContent: true,
            showModal: true,
            selectType: SELECT_TYPE.IMAGE,
        });
        wx.showToast({
            title: '识别成功',
        })
        setTimeout(() => {
            this.showModal()
        }, 0)
    },

    //界面：

    back: function () {
        this.runningCrs = false;
        this.setData({
            showOverlay: true,
            showContent: false,
            showModal: false,
            selectType: SELECT_TYPE.NONE,
        });
        this.hideLoading();
    },

    experience: function () {
        this.setData({
            showOverlay: false,
            showContent: true,
            selectType: SELECT_TYPE.IMAGE,
        });
        this.showModal()
    },

    scan: function () {
        this.runningCrs = true;
        this.setData({
            showOverlay: false,
            showContent: false,
            selectType: SELECT_TYPE.NONE,
        });
        this.busy = false
        this.showLoading("识别中");
    },

    download: function () {
        wx.saveImageToPhotosAlbum({
            filePath: "/images/namecard.jpg",
            success: res => {
                wx.showToast({title: "已保存到相册", icon: "none"});
            },
            fail: res => {
                wx.showToast({title: "保存失败", icon: "none"});
            },
        });
    },

    selectContent: function (e) {
        this.setData({
            selectType: e.currentTarget.dataset.contenttype,
        });
    },
});