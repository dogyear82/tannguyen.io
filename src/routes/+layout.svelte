<script>
    let { children } = $props();

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white'];

    let selectedColor = $state(colors[0]);
    let showSettings = $state(false);
</script>

<div class="container">
    <div class="content">
        {@render children()}
    </div>
</div>

<style>
    .container {
        min-height: 100vh;
        width: 100vw;
    }
    
    .content {
        border: 1px solid #000;
        display: grid;
        gap: 0 0;
        margin: 0 auto;
        min-height: 100vh;
    }

    .colors {
        align-items: center;
        display: grid;
        grid-gap: .5em;
		grid-template-columns: repeat(9, 1fr);
    }

    .color {
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--color, #fff);
        filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.2));
		transform: none;
        transition:L all 0.1s;
    }

	.color[aria-current="true"] {
		transform: translate(1px, 1px);
		filter: none;
		box-shadow: inset 3px 3px 4px rgba(0,0,0,0.2);
	}

    @media (min-width: 1920px) {
        .content {
            width: 1920px;
        }
    }

    @media (max-width: 1919px) {
        .content {
            width: 100%;
        }
    }
</style>