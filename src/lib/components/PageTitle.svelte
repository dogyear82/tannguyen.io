<script>
    let { text } = $props();
</script>

<h1 class="title">{text}</h1>

<style>
    .title {
        color: #373737;
        font-size: 150px;
        font-weight: 700;
        text-shadow:
            -1px -1px 0 white,
            1px -1px 0 white,
            -1px  1px 0 white,
            1px  1px 0 white;
    }
</style>