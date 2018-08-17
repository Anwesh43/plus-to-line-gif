const w = 500, h = 500, nodes = 5
class State {
    constructor() {
        this.scale = 0
        this.dir = 0
        this.prevScale = 0
    }

    update(cb) {
        this.scale += 0.05 * this.dir
        console.log(this.scale)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating() {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
        }
    }
}

class PTCNode {
    constructor(i) {
        this.i = i
        this.state = new State()
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new PTCNode(this.i + 1)
            this.next.prev = this
        }
    }

    update(cb) {
        this.state.update(cb)
    }

    startUpdating() {
        this.state.startUpdating()
    }

    draw(context) {
        const gap = w / (nodes + 1)
        var sc1 = Math.min(0.5, this.state.scale) * 2
        const sc2 = Math.min(0.5, Math.max(0, this.state.scale - 0.5)) * 2
        const factor = (this.i % 2)
        sc1 = (1 - sc1) * factor + (1 - factor) * sc1
        context.fillStyle = '#673AB7'
        context.save()
        context.translate(gap/2 + gap * this.i + gap * sc2, h/2)
        // context.fillRect(gap*sc2, -gap/6, gap * sc1,gap/3)
        for (var i = 0; i < 4; i++) {
            context.save()
            context.rotate(Math.PI/2 * i)
            context.fillStyle = '#673AB7'
            context.fillRect(0, -gap/16 ,(gap/4) * sc1, gap/8)
            context.beginPath()
            context.arc((gap/4) * sc1, 0, gap/16, 0, 2 * Math.PI)
            context.fillStyle = '#673AB7'
            context.fill()
            context.restore()
        }
        context.restore()
        if (this.next) {
            this.next.draw(context)
        }
    }

    getNext(dir, cb) {
        var curr = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class LinkedPTC {
    constructor() {
        this.curr = new PTCNode(0)
        this.dir = 1
    }

    draw(context) {
        this.curr.draw(context)
    }

    update(cb) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            if (this.dir == 1 && this.curr.i == 0) {
                cb()
            } else {
                this.startUpdating()
            }
        })
    }

    startUpdating() {
        this.curr.startUpdating()
    }
}

class Renderer {
    constructor() {
        this.running = true
        this.lptc = new LinkedPTC()
        this.lptc.startUpdating()
    }

    render(context, cb, endcb) {
        while(this.running) {
            context.fillStyle = '#212121'
            context.fillRect(0, 0, w, h)
            this.lptc.draw(context)
            cb(context)
            this.lptc.update(() => {
                endcb()
                this.running = false
            })
        }
    }
}

const GifEncoder = require('gifencoder')
const Canvas = require('canvas')
class PlusToCircleLinkedGif {
    constructor(fn) {
        this.renderer = new Renderer()
        this.encoder = new GifEncoder(w, h)
        this.canvas = new Canvas(w, h)
        this.context = this.canvas.getContext('2d')
        this.initEncoder(fn)
    }

    initEncoder(fn) {
        this.encoder.createReadStream().pipe(require('fs').createWriteStream(fn))
        this.encoder.setRepeat(0)
        this.encoder.setDelay(50)
    }

    render() {
        this.encoder.start()
        this.renderer.render(this.context, (ctx) => {
            console.log(ctx)
            this.encoder.addFrame(ctx)
        }, () => {
            this.encoder.end()
        })
    }

    static init(fn) {
        const gif = new PlusToCircleLinkedGif(fn)
        gif.render()
    }
}

PlusToCircleLinkedGif.init('test.gif')
