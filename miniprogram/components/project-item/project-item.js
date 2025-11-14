Component({
  properties: {
    item: { type: Object, value: {} },
    index: { type: Number, value: 0 }
  },
  methods: {
    onTap() { this.triggerEvent('select', { item: this.data.item, index: this.data.index }); }
  }
});
