// pages/index/game.wxml.js
let scrollTop = 0;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        operateCount: 0, // 操作次数
        count: 0, // 木条数
        maxStickLen: 85, // 木头最大长度 15差值递减
        stickHeight: 25,// 木头高度
        //拖动标记

        moving: false,
        movingId: -1,// 拖拽时的id 
        movingBottomPos: 0,// 拖拽过程中 变化 底部位置值
        movingOriginBottomPos: 0,// 当前拖拽的木条 的原始底部位置
        moveFromList: 0, // 当前拖拽的木条 来自于 哪个列表 1:A,2:B,3:C
        strMovingPosX: "0px",// 拖拽过程中 距离左边界的位置 字符串类型
        movingPosX: 0,// 拖拽过程中 距离左边界的位置 字符串类型

        moveStickOriginPosX: 0,// 当前拖拽木头的原始位置X
        moveStickOriginPosY: 0,// 当前拖拽木头的原始位置Y

        leftPosA: "16%",// 最终A 放置的位置 左侧的中间
        leftPosB: "50%",// 最终B 放置的位置 中间的中间
        leftPosC: "84%",// 最终C 放置的位置 右侧的中间
        translate: "translate(-50%, 0%)",// style 配合 leftPosA、leftPosB、leftPosC 居中
        untranslate: "translate(0%, 0%)",// style 拖拽时 设置为空

        touchStartX: 0,// 触摸点开始位置X
        touchStartY: 0,// 触摸点开始位置Y

        // 汉诺塔3列表
        stickListA: [],
        stickListB: [],
        stickListC: [],
        // 木头名称列表
        stickNameList: ["A", "B", "C", "D", "E", "F"],

        // 每个木条的所在列表
        stickIdinList: [],

        // 屏幕宽度，用于计算 拖动到 哪个部分
        screenWidth: 0,
        // px 转换为 rpx
        PxToRpx: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // 启动 生成
        let query = wx.createSelectorQuery().in(this)
        query.select('.items').boundingClientRect()
        query.selectViewport().scrollOffset()
        var _this = this;
        query.exec(function (res) {
            _this.setData({
                screenWidth: res[0].width, // 得到屏幕宽度
                PxToRpx: 750 / res[0].width // todo 转换值 待考虑
            })
        })

        var tempStickList = [];
        var tempStickIdInList = [];
        for (var i = 0; i < options.count; i++) {
            var stick = { id: i, width: this.data.maxStickLen - i * 20, height: this.data.stickHeight, bottomPos: this.data.stickHeight * i, stickName: this.data.stickNameList[i] };
            tempStickList.push(stick);
            tempStickIdInList.push(1);// 一开始 都在 1 ： lsitA
        }
        this.setData({
            count: options.count,
            stickListA: tempStickList,
            stickIdinList: tempStickIdInList
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },


    queryMultipleNodes: function (id) {
        let query = wx.createSelectorQuery().in(this)
        var key = ".stick" + id; // 根据 class=".stickX" 来捕获stick信息
        query.select(key).boundingClientRect()
        query.selectViewport().scrollOffset()
        var _this = this;
        query.exec(function (res) {
            var tempLeftPos = res[0].left;
            _this.setData({
                moveStickOriginPosX: res[0].left, // 记录stick的原始坐标值
                moveStickOriginPosY: res[0].top,// 记录stick的原始坐标值
                movingPosX: res[0].left,
                strMovingPosX: tempLeftPos + "px" // todo  先采用px 看看效果
            })
        })
    },

    touchStart: function (e) {
        console.log("== touchStart ==");
        var id = e.currentTarget.dataset.id;// 得到当前的stickId
        // 需要校验是不是 头部
        var tempDargOriginBottomPos = 0;
        this.queryMultipleNodes(id);// 获取当前触摸的stick 位置信息

        var tempStickList = this.data.stickListA; // 拷贝临时数据进行处理
        if (this.data.stickIdinList[id] == 2) {
            tempStickList = this.data.stickListB;
        }
        else if (this.data.stickIdinList[id] == 3) {
            tempStickList = this.data.stickListC;
        }

        if (tempStickList[tempStickList.length - 1].id != id) {
            wx.showToast({
                title: '操作失败',
                icon: 'error',
                duration: 600
            })
            console.log("can not move, because it is not top stick");
            return
        }
        tempDargOriginBottomPos = tempStickList[tempStickList.length - 1].bottomPos; // 获取原始bottom坐标值
        // 准备好开始触摸的信息
        this.setData({
            moveFromList: this.data.stickIdinList[id], // 当前触摸的stick来自哪个List
            movingId: id,// 当前触摸的stick id
            touchStartX: e.touches[0].pageX,// 触摸点的开始位置
            touchStartY: e.touches[0].pageY,// 触摸点的开始位置
            moving: true, // 设置正在触摸
            movingOriginBottomPos: tempDargOriginBottomPos, // 记录当前触摸的stick 原始 bottom 值
            movingBottomPos: tempDargOriginBottomPos //触摸后 一开始的 bottom 值
        });
    },

    touchMove: function (e) {
        if (!this.data.moving) return;
        var bottomPoxCha = e.touches[0].pageY - this.data.touchStartY;// 计算得到 当前触摸点 和 开始触摸点 的纵轴差值
        var PosXCha = e.touches[0].pageX - this.data.touchStartX;// 计算得到 当前触摸点 和 开始触摸点 的横轴差值
        var PosX = this.data.moveStickOriginPosX + PosXCha; // 得到 移动后的 横向坐标值

        this.setData({
            movingBottomPos: this.data.movingOriginBottomPos - bottomPoxCha, // 记录 移动后的 纵向坐标值
            strMovingPosX: PosX + "px",// 记录 移动后的 横向坐标值 字符串 todo
            movingPosX: PosX// 记录 移动后的 横向坐标值
        });
    },

    moveStickList: function (oldList, newList, oldStickList, newStickList) {
        console.log("moveStickList: move " + oldList + " to " + newList);
        if (oldList == newList) return;
        var oldStickLen = oldStickList.length;
        var newStickListLen = newStickList.length;
        var tempStick = oldStickList[oldStickLen - 1];

        if (newStickListLen < 1) {
            tempStick.bottomPos = this.data.stickHeight * newStickListLen;
            newStickList.push(tempStick);
            oldStickList.splice(oldStickLen - 1, 1);
        }
        else {
            if (newStickList[newStickListLen - 1].id < tempStick.id) {
                tempStick.bottomPos = this.data.stickHeight * newStickListLen;
                newStickList.push(tempStick);
                oldStickList.splice(oldStickLen - 1, 1);
            }
            else {
                console.log("it is bigger than top stick, can not move");
                return
            }
        }

        var tempStickIdInList = this.data.stickIdinList;
        tempStickIdInList[this.data.movingId] = newList;
        if (oldList == 1) {
            this.setData({
                stickListA: oldStickList
            })
        } else if (oldList == 2) {
            this.setData({
                stickListB: oldStickList
            })
        }
        else if (oldList == 3) {
            this.setData({
                stickListC: oldStickList
            })
        }

        if (newList == 1) {
            this.setData({
                stickListA: newStickList,
                stickIdinList: tempStickIdInList
            })
        } else if (newList == 2) {
            this.setData({
                stickListB: newStickList,
                stickIdinList: tempStickIdInList
            })
        }
        else if (newList == 3) {
            this.setData({
                stickListC: newStickList,
                stickIdinList: tempStickIdInList
            })
        }
        var opCount = this.data.operateCount + 1;
        this.setData({
            operateCount: opCount
        })
    },

    checkFinish: function () {
        if (this.data.stickListC.length == this.data.count) {
            var strResult = "操作次数为:" + this.data.operateCount;
            wx.showModal({
                title: '恭喜过关',
                content: strResult,
                success(res) {
                    if (res.confirm) {
                        console.log('用户点击确定')
                        wx.navigateTo({ url: './index', })
                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                }
            })
        }
    },

    touchEnd: function (e) {
        if (!this.data.moving) return;
        console.log("== touchEnd ==")
        // 拖动结束 需要判断是否 可以放入到当前位置的List中
        var tempOldStickList = this.data.stickListA;
        if (this.data.moveFromList == 2) {
            tempOldStickList = this.data.stickListB;
        }
        else if (this.data.moveFromList == 3) {
            tempOldStickList = this.data.stickListC;
        }

        var stickLen = tempOldStickList[tempOldStickList.length - 1].width;
        var stickMidPosX = this.data.movingPosX + stickLen / 2.0; // 得到中心位置

        var _this = this;
        var inList = this.data.moveFromList;


        if (stickMidPosX < this.data.screenWidth / 3.0) // 放置在左侧
        {
            var tempNewStickList = this.data.stickListA;
            this.moveStickList(inList, 1, tempOldStickList, tempNewStickList)
        }
        else if (stickMidPosX < this.data.screenWidth * 2.0 / 3.0 && this.data.screenWidth / 3.0 <= stickMidPosX) // 放置在中间
        {
            var tempNewStickList = this.data.stickListB;
            this.moveStickList(inList, 2, tempOldStickList, tempNewStickList)
        }
        else // 放置在 右侧
        {
            var tempNewStickList = this.data.stickListC;
            this.moveStickList(inList, 3, tempOldStickList, tempNewStickList)
        }

        this.setData({
            moving: false,
            movingId: -1,
            touchStartX: 0,
            touchStartY: 0,
            moveFromList: 0,
            movingOriginBottomPos: 0,
            movingBottomPos: 0,
        });
        this.checkFinish()
    },
    gotoMainPage: function (e) {
        console.log("back to index");
        wx.navigateTo({ url: './index', })
    },
})