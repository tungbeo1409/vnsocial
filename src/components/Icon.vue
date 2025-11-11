<template>
  <component 
    v-if="iconComponent" 
    :is="iconComponent" 
    :style="iconStyle"
    :class="props.class"
  />
</template>

<script setup>
import { computed } from 'vue'
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BellIcon,
  HeartIcon,
  TrashIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  MicrophoneIcon,
  PaperClipIcon,
  VideoCameraIcon,
  FaceSmileIcon,
  ArrowLeftIcon,
  CheckIcon,
  UserIcon,
  HomeIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  ShareIcon,
  BookmarkIcon,
  FlagIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  PencilIcon,
  EyeIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'
import {
  HeartIcon as HeartSolidIcon,
  BellIcon as BellSolidIcon
} from '@heroicons/vue/24/solid'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 24
  },
  class: {
    type: String,
    default: ''
  },
  solid: {
    type: Boolean,
    default: false
  }
})

const iconMap = {
  search: MagnifyingGlassIcon,
  message: ChatBubbleLeftRightIcon,
  users: UserGroupIcon,
  bell: BellIcon,
  bellSolid: BellSolidIcon,
  heart: HeartIcon,
  heartSolid: HeartSolidIcon,
  trash: TrashIcon,
  photo: PhotoIcon,
  send: PaperAirplaneIcon,
  close: XMarkIcon,
  microphone: MicrophoneIcon,
  attachment: PaperClipIcon,
  video: VideoCameraIcon,
  emoji: FaceSmileIcon,
  arrowLeft: ArrowLeftIcon,
  check: CheckIcon,
  user: UserIcon,
  home: HomeIcon,
  plus: PlusIcon,
  more: EllipsisHorizontalIcon,
  share: ShareIcon,
  bookmark: BookmarkIcon,
  flag: FlagIcon,
  play: PlayIcon,
  pause: PauseIcon,
  stop: StopIcon,
  loading: ArrowPathIcon,
  edit: PencilIcon,
  eye: EyeIcon,
  lock: LockClosedIcon
}

const iconComponent = computed(() => {
  const iconName = props.solid && props.name === 'heart' ? 'heartSolid' : 
                   props.solid && props.name === 'bell' ? 'bellSolid' : 
                   props.name
  return iconMap[iconName] || iconMap[props.name] || null
})

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: size,
    height: size,
    flexShrink: 0
  }
})
</script>

