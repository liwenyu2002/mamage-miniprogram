Component({
  methods: {
    onUpload() { this.triggerEvent('upload'); },
    onPublish() { this.triggerEvent('publish'); }
  }
});
