const isObject = v => typeof v === 'object'

function reactive(obj) {
  if (!isObject(obj)) {
    return obj
  }

  return new Proxy(obj, {
    get(target, key) {
      console.log('get', key)
      const res = Reflect.get(target, key)
      // 执行依赖收集
      track(target, key)
      return isObject(res) ? reactive(res) : res
    },
    set(target, key, val) {
      console.log('set', key)
      const res = Reflect.set(target, key, val)
      trigger(target, key)
      return res
    },
    deleteProperty(target, key) {
      console.log('deleteProperty', key)
      const res = Reflect.deleteProperty(target, key)
      trigger(target, key)
      return res
    }
  })
}

// 保存cb数组
const effectStack = []

// 添加副作用函数
function effect(fn) {
  const e = createReactiveEffect(fn)

  // 立刻执行一次，触发依赖收集
  e()

  return e
}

function createReactiveEffect(fn) {
  const effect = function reactiveEffect() {
    // 防止可能错误
    // fn放入effectStack
    // fn弹出effectStack
    try {
      effectStack.push(effect)
      return fn()
    } finally {
      effectStack.pop()
    }
  }
  return effect
}

const targetMap = new WeakMap() // 存储依赖关系数据结构
// 依赖收集
function track(target, key) {
  const effect = effectStack[effectStack.length - 1]
  if (effect) {
    // 建立target，key和effect之间映射关系
    let depMap = targetMap.get(target)
    // 初始化时不存在创建一个
    if (!depMap) {
      depMap = new Map()
      targetMap.set(target, depMap)
    }

    // 获取key对象的set
    let deps = depMap.get(key)
    if (!deps) {
      deps = new Set()
      depMap.set(key, deps)
    }

    deps.add(effect)
  }
}

// 触发函数
function trigger(target, key) {
  // 根据target和key获取对应的set
  // 并循环执行他们
  const depMap = targetMap.get(target)
  if (!depMap) {
    return
  }

  const deps = depMap.get(key)
  deps.forEach(dep => dep())
}

const obj = reactive({
  foo: 'foo',
  a: { b: 1 }
})

effect(() => {
  console.log(obj.foo);
})
effect(() => {
  console.log(obj.foo, obj.a.b);
})

// obj.foo
obj.foo = 'fooooooo'
// obj.bar = 'bar'
// delete obj.bar
// obj.a.b
